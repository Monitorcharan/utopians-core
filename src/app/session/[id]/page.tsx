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
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  PhoneOff,
  MessageSquare,
  Send,
  X,
  Loader2,
  Clock,
  AlertCircle,
  RefreshCw,
  User as UserIcon,
} from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  senderRole: "student" | "teacher";
  senderName: string;
  text: string;
  timestamp: string;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export default function SessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  // Support both [id] and [sessionId] folder conventions
  const sessionId = (params?.sessionId || params?.id) as string;

  // Session & User state
  const [session, setSession] = useState<Session | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"student" | "teacher">("student");
  const [userName, setUserName] = useState<string>("User");
  const [isCaller, setIsCaller] = useState<boolean>(false);
  const sessionTopic = "Live 1-on-1 Micro-Tutoring";

  // Peer details & reviews
  const [peerName, setPeerName] = useState<string>("Mentor");
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // WebRTC & Media States
  const [mediaPermissionError, setMediaPermissionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected" | "disconnected" | "failed"
  >("idle");
  const [hasRemoteStream, setHasRemoteStream] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Elapsed Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Chat state
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      senderRole: "teacher",
      senderName: "System",
      text: "Welcome to your live 1-on-1 WebRTC tutoring session! Audio, video, and screen sharing are now active.",
      timestamp: "Just now",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebRTC DOM Refs & State Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const signalChannelRef = useRef<RealtimeChannel | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const hasInitializedCall = useRef<boolean>(false);

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

  // Helper: Drain queued ICE candidates once remote description is active
  const drainQueuedCandidates = useCallback(async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      if (candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Error adding queued ICE candidate:", err);
        }
      }
    }
  }, []);

  // 2. Fetch Session & Current User details
  useEffect(() => {
    if (!sessionId) return;

    async function loadSessionAndUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name, username")
            .eq("id", user.id)
            .single();

          const detectedRole = (profile?.role as "student" | "teacher") || "student";
          setUserRole(detectedRole);
          const name =
            profile?.full_name ||
            profile?.username ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User";
          setUserName(name);
        }

        // Fetch session row if valid UUID
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(sessionId)) {
          return;
        }

        const { data: sessionData, error } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (error || !sessionData) {
          console.warn("Could not find session row for ID:", sessionId);
          return;
        }

        setSession(sessionData as Session);

        // Caller is the student who created/requested the session
        const isUserCaller = user?.id === sessionData.student_id;
        setIsCaller(isUserCaller);

        // Fetch peer profile for avatar & name display
        const peerId = isUserCaller ? sessionData.teacher_id : sessionData.student_id;
        if (peerId) {
          const { data: peerProfile } = await supabase
            .from("profiles")
            .select("full_name, username, avatar_url")
            .eq("id", peerId)
            .single();

          if (peerProfile) {
            setPeerName(
              peerProfile.full_name ||
                peerProfile.username ||
                (isUserCaller ? "Teacher" : "Student")
            );
            setPeerAvatarUrl(peerProfile.avatar_url || null);
          }
        }
      } catch (err) {
        console.error("Failed to load session details:", err);
      }
    }

    loadSessionAndUser();
  }, [sessionId, supabase]);

  // 3. Setup WebRTC PeerConnection & Realtime Signaling
  const startWebRTC = useCallback(async () => {
    if (!sessionId || !currentUserId || hasInitializedCall.current) return;
    hasInitializedCall.current = true;

    try {
      // A. Acquire Local Audio & Video Stream
      let localStream: MediaStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        setMediaPermissionError(null);
        setConnectionStatus("connecting");
      } catch (mediaErr: unknown) {
        console.error("getUserMedia error:", mediaErr);
        const name = (mediaErr as Error)?.name;
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setMediaPermissionError(
            "Camera and microphone permissions were denied. Please allow access in your browser settings to join the call."
          );
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setMediaPermissionError(
            "No camera or microphone was detected. Please connect a webcam/microphone to continue."
          );
        } else {
          setMediaPermissionError(
            "Unable to access camera or microphone. Please check your browser permissions."
          );
        }
        setConnectionStatus("failed");
        hasInitializedCall.current = false;
        return;
      }

      localStreamRef.current = localStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // B. Create RTCPeerConnection
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      // Add local media tracks to peer connection
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setHasRemoteStream(true);
        }
      };

      // Handle connection state transitions
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          setConnectionStatus("connected");
        } else if (state === "connecting") {
          setConnectionStatus("connecting");
        } else if (state === "disconnected" || state === "closed") {
          setConnectionStatus("disconnected");
        } else if (state === "failed") {
          setConnectionStatus("failed");
        }
      };

      // C. Setup Supabase Realtime Signaling Channel
      const channel = supabase.channel(`session:${sessionId}`, {
        config: { broadcast: { self: false } },
      });
      signalChannelRef.current = channel;

      // Listen for ICE candidates generated locally and send via Supabase Realtime
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "ice-candidate",
              candidate: event.candidate.toJSON(),
              senderId: currentUserId,
            },
          });
        }
      };

      // Helper function to create and transmit SDP offer
      const sendOffer = async () => {
        if (!pcRef.current) return;
        try {
          const offer = await pcRef.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pcRef.current.setLocalDescription(offer);
          await channel.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "offer",
              sdp: offer,
              senderId: currentUserId,
            },
          });
        } catch (offerErr) {
          console.error("Failed to generate or send SDP offer:", offerErr);
        }
      };

      // Handle inbound signals from peer
      channel.on("broadcast", { event: "signal" }, async (message) => {
        const { payload } = message;
        if (!payload || payload.senderId === currentUserId) return;

        try {
          // 1. Peer announcement ("ready")
          if (payload.type === "ready") {
            // If we are caller, create and dispatch the SDP offer!
            if (isCaller) {
              await sendOffer();
            }
          }
          // 2. Inbound SDP Offer (Callee receives offer from Caller)
          else if (payload.type === "offer") {
            if (!pcRef.current) return;
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(payload.sdp)
            );
            await drainQueuedCandidates();

            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);

            await channel.send({
              type: "broadcast",
              event: "signal",
              payload: {
                type: "answer",
                sdp: answer,
                senderId: currentUserId,
              },
            });
          }
          // 3. Inbound SDP Answer (Caller receives answer from Callee)
          else if (payload.type === "answer") {
            if (!pcRef.current) return;
            if (pcRef.current.signalingState === "have-local-offer") {
              await pcRef.current.setRemoteDescription(
                new RTCSessionDescription(payload.sdp)
              );
              await drainQueuedCandidates();
            }
          }
          // 4. Inbound ICE Candidate
          else if (payload.type === "ice-candidate") {
            if (!pcRef.current) return;
            if (pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
              try {
                await pcRef.current.addIceCandidate(
                  new RTCIceCandidate(payload.candidate)
                );
              } catch (candidateErr) {
                console.warn("Failed to add ice candidate immediately:", candidateErr);
              }
            } else {
              iceCandidatesQueue.current.push(payload.candidate);
            }
          }
          // 5. Inbound Call Ended signal
          else if (payload.type === "call-ended") {
            setConnectionStatus("disconnected");
            setIsReviewModalOpen(true);
          }
        } catch (signalErr) {
          console.error("Error processing WebRTC signal:", signalErr);
        }
      });

      // Subscribe to signaling channel
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Announce that we are ready
          await channel.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "ready",
              senderId: currentUserId,
              isCaller,
            },
          });

          // If we are caller, immediately send offer as well
          if (isCaller) {
            await sendOffer();
          }
        }
      });
    } catch (generalErr) {
      console.error("WebRTC initialization failed:", generalErr);
      setConnectionStatus("failed");
      hasInitializedCall.current = false;
    }
  }, [sessionId, currentUserId, isCaller, drainQueuedCandidates, supabase]);

  // Trigger WebRTC startup once user ID and session are loaded
  useEffect(() => {
    let isCancelled = false;
    let timer: NodeJS.Timeout | null = null;

    if (sessionId && currentUserId && session) {
      timer = setTimeout(() => {
        if (!isCancelled) {
          startWebRTC();
        }
      }, 0);
    }

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
      // Teardown WebRTC on unmount
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (signalChannelRef.current) {
        supabase.removeChannel(signalChannelRef.current);
        signalChannelRef.current = null;
      }
      hasInitializedCall.current = false;
    };
  }, [sessionId, currentUserId, session, startWebRTC, supabase]);

  // 4. Realtime Chat Subscription
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

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isMobileChatOpen]);

  // 5. Send Chat Message
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

    // Broadcast to session chat channel
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

  // 6. Media Controls: Mute / Unmute Audio
  const handleToggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      const mutedNow = audioTracks.length > 0 && !audioTracks[0].enabled;
      setIsAudioMuted(mutedNow);
    }
  };

  // 7. Media Controls: Enable / Disable Video
  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      const videoOffNow = videoTracks.length > 0 && !videoTracks[0].enabled;
      setIsVideoOff(videoOffNow);
    }
  };

  // 8. Media Controls: Screen Share (getDisplayMedia + replaceTrack)
  const stopScreenSharing = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    // Revert peer connection video track back to camera
    if (pcRef.current && localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const videoSender = pcRef.current
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (videoSender && cameraTrack) {
        await videoSender.replaceTrack(cameraTrack);
      }
    }

    setIsScreenSharing(false);
  }, []);

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          alert("Screen sharing is not supported by your browser.");
          return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenStreamRef.current = screenStream;

        // Replace track on peer connection
        if (pcRef.current) {
          const videoSender = pcRef.current
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (videoSender && screenTrack) {
            await videoSender.replaceTrack(screenTrack);
          }
        }

        setIsScreenSharing(true);

        // Revert back when user clicks native browser "Stop Sharing" button
        screenTrack.onended = () => {
          stopScreenSharing();
        };
      } catch (err) {
        console.warn("Screen share canceled or denied:", err);
      }
    } else {
      await stopScreenSharing();
    }
  };

  // 9. End Call & Cleanup
  const handleEndCall = async () => {
    // Notify peer
    if (signalChannelRef.current && currentUserId) {
      try {
        await signalChannelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "call-ended",
            senderId: currentUserId,
          },
        });
      } catch (err) {
        console.warn("Failed to notify peer of call termination:", err);
      }
    }

    // Stop media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }

    // Open review modal
    setIsReviewModalOpen(true);
  };

  // 10. Submit Rating & Review
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
      console.error("Failed to end session with review:", err);
    } finally {
      localStorage.removeItem("room_url");
      setTimeout(() => {
        if (userRole === "teacher") {
          router.push("/teacher/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      }, 800);
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
      console.error("Failed to end session on skip:", err);
    } finally {
      localStorage.removeItem("room_url");
      if (userRole === "teacher") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    }
  };

  // Retry permissions
  const handleRetryPermissions = () => {
    hasInitializedCall.current = false;
    startWebRTC();
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

            {/* Connection Status Pill */}
            {connectionStatus === "connected" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/50 px-2.5 py-0.5 text-[11px] font-mono text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected &bull; Live
              </span>
            )}
            {connectionStatus === "connecting" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-950/80 border border-indigo-600/50 px-2.5 py-0.5 text-[11px] font-mono text-indigo-300">
                <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                Connecting...
              </span>
            )}
            {connectionStatus === "idle" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 border border-amber-600/50 px-2.5 py-0.5 text-[11px] font-mono text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Waiting for peer...
              </span>
            )}
            {(connectionStatus === "disconnected" || connectionStatus === "failed") && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/80 border border-rose-600/50 px-2.5 py-0.5 text-[11px] font-mono text-rose-300">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Center: Running Elapsed Timer */}
        <div className="flex items-center gap-2 rounded-full bg-slate-800/90 border border-slate-700/60 px-3 py-1 text-xs font-mono font-medium text-slate-200 shadow-inner">
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
          {/* WebRTC Video Viewport */}
          <div className="flex-1 flex items-center justify-center relative w-full h-full bg-slate-950 overflow-hidden">
            {/* Permission Error Banner */}
            {mediaPermissionError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto bg-slate-900/90 border border-rose-500/30 rounded-2xl shadow-2xl backdrop-blur-md">
                <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Media Access Required</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  {mediaPermissionError}
                </p>
                <button
                  type="button"
                  onClick={handleRetryPermissions}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry Access
                </button>
              </div>
            ) : (
              <>
                {/* Remote Video Stream (Full Viewport) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-contain bg-black transition-opacity duration-300 ${
                    hasRemoteStream ? "opacity-100" : "opacity-0 absolute"
                  }`}
                />

                {/* Waiting for Peer Placeholder Card (when remote stream is not yet active) */}
                {!hasRemoteStream && (
                  <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto">
                    <div className="relative mb-6">
                      {/* Pulsing ring animation */}
                      <div className="absolute -inset-3 rounded-full bg-indigo-500/20 animate-ping" />
                      <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl border border-indigo-400/30 overflow-hidden">
                        {peerAvatarUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={peerAvatarUrl}
                            alt={peerName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{peerName ? peerName[0]?.toUpperCase() : <UserIcon className="h-10 w-10 text-white/80" />}</span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{peerName}</h3>
                    <p className="text-xs text-indigo-300/90 font-mono mb-4">
                      {isCaller ? "Teacher (Callee)" : "Student (Caller)"}
                    </p>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-400 font-mono">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>
                        {connectionStatus === "connecting"
                          ? "Establishing peer connection..."
                          : `Waiting for ${peerName} to join...`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Picture-in-Picture Local Video Preview (Floating Bottom-Right) */}
                <div className="absolute bottom-4 right-4 w-40 h-28 sm:w-56 sm:h-36 rounded-2xl overflow-hidden border border-white/15 bg-slate-900 shadow-2xl z-10 backdrop-blur-md group">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover -scale-x-100 ${
                      isVideoOff ? "hidden" : "block"
                    }`}
                  />

                  {/* Camera Off Overlay for Local Preview */}
                  {isVideoOff && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-1.5">
                      <VideoOff className="h-6 w-6 text-slate-500" />
                      <span className="text-[10px] font-mono text-slate-400">Camera Off</span>
                    </div>
                  )}

                  {/* Name badge inside PiP */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-medium text-white/90">
                    <span>You</span>
                    {isAudioMuted && <MicOff className="h-3 w-3 text-amber-400" />}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 3. BOTTOM CONTROL BAR */}
          <div className="h-18 bg-slate-950/90 border-t border-slate-800/80 px-4 sm:px-8 flex items-center justify-center gap-3 sm:gap-5 z-20 shrink-0 backdrop-blur-md">
            {/* Mute Audio Button */}
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isAudioMuted
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white"
              }`}
              title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isAudioMuted ? (
                <MicOff className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              ) : (
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="text-[10px] font-medium tracking-wide">
                {isAudioMuted ? "Unmute" : "Mute"}
              </span>
            </button>

            {/* Enable/Disable Video Button */}
            <button
              type="button"
              onClick={handleToggleVideo}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isVideoOff
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white"
              }`}
              title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isVideoOff ? (
                <VideoOff className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              ) : (
                <VideoIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="text-[10px] font-medium tracking-wide">
                {isVideoOff ? "Start Video" : "Stop Video"}
              </span>
            </button>

            {/* Screen Share Button */}
            <button
              type="button"
              onClick={handleToggleScreenShare}
              className={`flex flex-col items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isScreenSharing
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white"
              }`}
              title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            >
              <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] font-medium tracking-wide">
                {isScreenSharing ? "Sharing" : "Screen Share"}
              </span>
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              disabled={isEnding}
              className="flex flex-col items-center justify-center gap-1 px-5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 shadow-sm shadow-rose-900/40 transition-all disabled:opacity-60 cursor-pointer"
              title="End Session"
            >
              {isEnding ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="text-[10px] font-semibold tracking-wide">
                End Call
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

