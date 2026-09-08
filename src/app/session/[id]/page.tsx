"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Session } from "@/types";
import { RatingModal } from "@/components/features/rating-modal";
import {
  Zap,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  MessageSquare,
  Send,
  X,
  Loader2,
  Clock,
} from "lucide-react";

interface ChatMessage {
  id: string;
  senderRole: "student" | "teacher";
  senderName: string;
  text: string;
  timestamp: string;
}

export default function SessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  // Support both [id] and [sessionId] folder conventions
  const sessionId = (params?.sessionId || params?.id) as string;

  const [session, setSession] = useState<Session | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<"student" | "teacher">("student");
  const [userName, setUserName] = useState<string>("User");
  const [sessionTopic, setSessionTopic] = useState<string>("Live Tutoring Session");

  // Peer feedback & rating state
  const [peerName, setPeerName] = useState<string>("Mentor");
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Control bar states
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Chat state
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      senderRole: "teacher",
      senderName: "System",
      text: "Welcome to your live 1-on-1 tutoring session! You can use this chat to share code snippets, links, and questions.",
      timestamp: "Just now",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Elapsed Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 2. Load Session & User Details
  useEffect(() => {
    async function loadSessionDetails() {
      if (!sessionId) return;

      try {
        // 1. Fetch current user and profile (full_name)
        let fullName = "User";
        let detectedRole: "student" | "teacher" = "student";

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name, username")
            .eq("id", user.id)
            .single();

          if (profile) {
            detectedRole = (profile.role as "student" | "teacher") || "student";
            setUserRole(detectedRole);
            fullName =
              profile.full_name ||
              profile.username ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "User";
            setUserName(fullName);
          } else {
            fullName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "User";
            setUserName(fullName);
          }
        }

        // 2. Fetch session record from Supabase
        const { data: sessionData, error } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (error) {
          console.error("Error loading session:", error);
        }

        // 3. Construct Jitsi room URL with user's full_name and prejoin/name bypass
        const baseRoomUrl =
          sessionData?.room_url ||
          `https://meet.jit.si/utopians-core-${sessionId}`;
        const cleanBase = baseRoomUrl.split("?")[0].split("#")[0];
        const encodedName = encodeURIComponent(fullName);
        const jsonEncodedName = encodeURIComponent(JSON.stringify(fullName));

        // Auto-fills displayName and bypasses prejoin lobby and login prompts
        const jitsiUrl = `${cleanBase}?userInfo.displayName=${encodedName}#config.prejoinPageEnabled=false&config.prejoinConfig.enabled=false&config.requireDisplayName=false&userInfo.displayName=${jsonEncodedName}`;

        setRoomUrl(jitsiUrl);
        localStorage.setItem("room_url", jitsiUrl);

        if (sessionData) {
          setSession(sessionData as Session);
          setSessionTopic("Live 1-on-1 Micro-Tutoring");

          // Fetch peer profile for rating & reviews
          const peerId =
            detectedRole === "student"
              ? sessionData.teacher_id
              : sessionData.student_id;

          if (peerId) {
            const { data: peerData } = await supabase
              .from("profiles")
              .select("full_name, username, avatar_url")
              .eq("id", peerId)
              .single();

            if (peerData) {
              setPeerName(
                peerData.full_name ||
                  peerData.username ||
                  (detectedRole === "student" ? "Teacher" : "Student")
              );
              setPeerAvatarUrl(peerData.avatar_url || null);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSessionDetails();

    // Listen for session completion by peer
    const statusChannel = supabase
      .channel(`session-completion-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as Session;
          if (updated && updated.status === "completed") {
            setIsReviewModalOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [sessionId, supabase]);

  // 3. Supabase Realtime Chat Subscription
  useEffect(() => {
    if (!sessionId) return;

    const chatChannel = supabase
      .channel(`session-chat-${sessionId}`)
      .on("broadcast", { event: "chat_message" }, (payload) => {
        const msg = payload.payload as ChatMessage;
        if (msg && msg.id) {
          setChatMessages((prev) => [...prev, msg]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [sessionId, supabase]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isMobileChatOpen]);

  // 4. Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderRole: userRole,
      senderName: userName,
      text: newMessage.trim(),
      timestamp: timeString,
    };

    // Optimistically update local UI
    setChatMessages((prev) => [...prev, msg]);
    setNewMessage("");

    // Broadcast message to session channel
    try {
      const chatChannel = supabase.channel(`session-chat-${sessionId}`);
      await chatChannel.subscribe();
      await chatChannel.send({
        type: "broadcast",
        event: "chat_message",
        payload: msg,
      });
    } catch (err) {
      console.error("Failed to broadcast chat message:", err);
    }
  };

  // 5. Handle End Session Trigger
  const handleEndSession = () => {
    setIsReviewModalOpen(true);
  };

  // Submit Rating & Review
  const handleReviewSubmit = async (data: {
    rating?: number;
    comment?: string;
  }) => {
    setIsEnding(true);
    try {
      if (sessionId) {
        const payload: Record<string, unknown> = { sessionId };
        if (userRole === "student") {
          if (data.rating) payload.studentRating = data.rating;
          if (data.comment) payload.studentComment = data.comment;
        } else {
          if (data.rating) payload.teacherRating = data.rating;
          if (data.comment) payload.teacherComment = data.comment;
        }

        await fetch("/api/end-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch (err) {
      console.error("Failed to call /api/end-session with review:", err);
    } finally {
      localStorage.removeItem("room_url");
      setTimeout(() => {
        if (userRole === "teacher") {
          router.push("/teacher/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      }, 1000);
    }
  };

  // Skip Review
  const handleReviewSkip = async () => {
    setIsEnding(true);
    try {
      if (sessionId) {
        await fetch("/api/end-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      }
    } catch (err) {
      console.error("Failed to call /api/end-session on skip:", err);
    } finally {
      localStorage.removeItem("room_url");
      if (userRole === "teacher") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    }
  };

  // 6. Handle Controls (Mute & Screen Share)
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
          });
          setIsScreenSharing(true);
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
          };
        } else {
          setIsScreenSharing((prev) => !prev);
        }
      } catch (err) {
        console.warn("Screen sharing canceled or unsupported:", err);
      }
    } else {
      setIsScreenSharing(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white font-sans overflow-hidden select-none">
      {/* 1. TOP BAR */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        {/* Left: Brand & Session Topic */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight hidden sm:inline">
              Utopians<span className="text-indigo-400">Core</span>
            </span>
          </Link>

          <span className="text-slate-600 hidden sm:inline">&bull;</span>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-medium text-slate-200 truncate">
              {sessionTopic}
            </span>
            <span className="hidden md:inline-flex items-center rounded-full bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
              {session?.status || "ACTIVE"}
            </span>
          </div>
        </div>

        {/* Center: Running Elapsed Timer */}
        <div className="flex items-center gap-2 rounded-full bg-slate-800/90 border border-slate-700/60 px-3 py-1 text-xs font-mono font-medium text-slate-200 shadow-inner">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="tracking-wider">{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Right: Mobile Chat Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileChatOpen((prev) => !prev)}
            className="lg:hidden relative p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            aria-label="Toggle Session Chat"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY: 75% VIDEO + 25% CHAT */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* VIDEO AREA (75% on Desktop, 100% on Mobile) */}
        <div className="w-full lg:w-3/4 h-full bg-black flex flex-col relative overflow-hidden">
          {/* Centered Jitsi Meet Video Room */}
          <div className="flex-1 flex items-center justify-center relative w-full h-full bg-black">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span>Connecting to Jitsi Meet video room...</span>
              </div>
            ) : roomUrl ? (
              <iframe
                src={roomUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                allowFullScreen
                className="w-full h-full border-0 bg-black"
                title="Jitsi Meet Live Video Call"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-500 text-xs font-mono">
                <p>Waiting for video room synchronization...</p>
                <span className="text-[11px] text-slate-600">Session ID: {sessionId}</span>
              </div>
            )}
          </div>

          {/* 3. BOTTOM CONTROL BAR */}
          <div className="h-18 bg-slate-950/90 border-t border-slate-800/80 px-4 sm:px-8 flex items-center justify-center gap-4 sm:gap-6 z-20 shrink-0 backdrop-blur-md">
            {/* Screen Share Button */}
            <button
              type="button"
              onClick={handleToggleScreenShare}
              className={`flex flex-col items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isScreenSharing
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] font-medium tracking-wide">
                {isScreenSharing ? "Sharing" : "Screen Share"}
              </span>
            </button>

            {/* Mute Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isMuted
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              ) : (
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="text-[10px] font-medium tracking-wide">
                {isMuted ? "Unmute" : "Mute"}
              </span>
            </button>

            {/* End Session Button */}
            <button
              type="button"
              onClick={handleEndSession}
              disabled={isEnding}
              className="flex flex-col items-center justify-center gap-1 px-5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 shadow-sm shadow-rose-900/40 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isEnding ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="text-[10px] font-semibold tracking-wide">
                End Session
              </span>
            </button>
          </div>
        </div>

        {/* 4. CHAT SIDEBAR (25% on Desktop, Slide-over on Mobile) */}
        <aside
          className={`h-full bg-white text-slate-900 border-l border-slate-200 flex flex-col z-30 transition-transform duration-300 ease-in-out ${
            isMobileChatOpen
              ? "fixed inset-y-0 right-0 w-full sm:w-80 flex shadow-2xl"
              : "hidden lg:flex lg:w-1/4"
          }`}
        >
          {/* Chat Header */}
          <div className="h-14 border-b border-slate-200 px-4 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Session Chat
              </h2>
            </div>

            {/* Close button for Mobile Drawer */}
            <button
              type="button"
              onClick={() => setIsMobileChatOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              aria-label="Close Chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
            {chatMessages.map((msg) => {
              // Exact requirement: student messages on right, teacher messages on left
              const isStudent = msg.senderRole === "student";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isStudent ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-slate-500">
                      {msg.senderName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                      isStudent
                        ? "bg-indigo-600 text-white rounded-tr-xs"
                        : "bg-slate-100 text-slate-900 rounded-tl-xs border border-slate-200/80"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </aside>
      </div>

      {/* Post-Session Rating & Review Modal */}
      <RatingModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
        onSkip={handleReviewSkip}
        userRole={userRole}
        peerName={peerName}
        peerAvatarUrl={peerAvatarUrl}
      />
    </div>
  );
}
