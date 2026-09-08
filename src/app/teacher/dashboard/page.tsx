"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile, Session } from "@/types";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Bell,
  X,
  Plus,
  PhoneCall,
  Video,
  Calendar,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  Clock,
  DollarSign,
  History,
  BookOpen,
  ArrowRight,
} from "lucide-react";

interface IncomingSessionRequest {
  sessionId: string;
  studentId: string;
  studentName: string;
  roomUrl?: string;
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Profile & Status State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Status feedback message
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "neutral" | "error";
    text: string;
  } | null>(null);

  // Skills state
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [isSavingSkill, setIsSavingSkill] = useState(false);

  // Real-time Incoming Session Request Modal State
  const [incomingRequest, setIncomingRequest] = useState<IncomingSessionRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isResponding, setIsResponding] = useState<boolean>(false);

  // Session stats & recent logs state
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<string | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [totalMinutesTaught, setTotalMinutesTaught] = useState<number>(0);
  const [todaysMinutesTaught, setTodaysMinutesTaught] = useState<number>(0);

  // Scheduled & Recent Sessions
  const [scheduledSessions, setScheduledSessions] = useState<
    Array<{
      id: string;
      studentName: string;
      studentAvatarUrl: string | null;
      scheduled_start_time: string;
      scheduled_end_time: string | null;
      status: string;
      room_url: string;
    }>
  >([]);
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [recentSessions, setRecentSessions] = useState<
    Array<{
      id: string;
      studentName: string;
      started_at: string;
      ended_at: string | null;
      durationText: string;
      dateText: string;
      status: string;
      room_url: string;
    }>
  >([]);

  // Real-time ticking timer for countdown accuracy
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch teacher profile & session statistics
  useEffect(() => {
    async function loadTeacherProfile() {
      setIsLoading(true);
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/teacher/login");
          return;
        }

        setEmail(user.email || "");

        // Fetch teacher profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setIsOnline(Boolean(profileData.is_online));
          setSkills(profileData.skills || []);
        } else {
          const fallback: Profile = {
            id: user.id,
            username:
              user.user_metadata?.username ||
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "Teacher",
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            bio: null,
            role: "teacher",
            is_online: false,
            skills: user.user_metadata?.skills || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(fallback);
          setIsOnline(false);
          setSkills(fallback.skills);
        }

        // Fetch sessions for this teacher
        const { data: teacherSessions } = await supabase
          .from("sessions")
          .select("id, started_at, ended_at, status, student_id, room_url, scheduled_start_time, scheduled_end_time")
          .eq("teacher_id", user.id)
          .order("started_at", { ascending: false });

        if (teacherSessions) {
          const completed = teacherSessions.filter((s) => s.status === "completed");
          setCompletedSessionsCount(completed.length);

          // Calculate total minutes taught
          let totalMinutes = 0;
          let todayMinutes = 0;
          const todayDateStr = new Date().toDateString();

          completed.forEach((s) => {
            if (s.started_at && s.ended_at) {
              const startMs = new Date(s.started_at).getTime();
              const endMs = new Date(s.ended_at).getTime();
              const diffMins = Math.max(1, Math.round((endMs - startMs) / 60000));
              totalMinutes += diffMins;

              if (new Date(s.started_at).toDateString() === todayDateStr) {
                todayMinutes += diffMins;
              }
            }
          });

          setTotalMinutesTaught(totalMinutes);
          setTodaysMinutesTaught(todayMinutes);

          // Student profiles for sessions
          const studentIds = Array.from(new Set(teacherSessions.map((r) => r.student_id).filter(Boolean)));
          const studentMap: Record<string, { name: string; avatarUrl: string | null }> = {};

          if (studentIds.length > 0) {
            const { data: studentProfiles } = await supabase
              .from("profiles")
              .select("id, full_name, username, avatar_url")
              .in("id", studentIds);

            if (studentProfiles) {
              studentProfiles.forEach((st) => {
                studentMap[st.id] = {
                  name: st.full_name || st.username || "Student",
                  avatarUrl: st.avatar_url || null,
                };
              });
            }
          }

          // Scheduled sessions sorted by scheduled start time
          const scheduled = teacherSessions.filter((s) => s.status === "scheduled");
          scheduled.sort((a, b) => {
            const tA = new Date(a.scheduled_start_time || a.started_at).getTime();
            const tB = new Date(b.scheduled_start_time || b.started_at).getTime();
            return tA - tB;
          });

          setScheduledSessions(
            scheduled.map((s) => ({
              id: s.id,
              studentName: studentMap[s.student_id]?.name || "Student Learner",
              studentAvatarUrl: studentMap[s.student_id]?.avatarUrl || null,
              scheduled_start_time: s.scheduled_start_time || s.started_at,
              scheduled_end_time: s.scheduled_end_time,
              status: s.status,
              room_url: s.room_url || `/session/${s.id}`,
            }))
          );

          // Recent non-scheduled sessions
          const nonScheduled = teacherSessions.filter((s) => s.status !== "scheduled");
          const recent = nonScheduled.slice(0, 5);

          setRecentSessions(
            recent.map((s) => {
              let duration = "Active";
              if (s.ended_at && s.started_at) {
                const diff = Math.max(
                  0,
                  Math.floor(
                    (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000
                  )
                );
                duration = diff < 60 ? `${diff}s` : `${Math.round(diff / 60)} mins`;
              }
              const d = new Date(s.started_at);
              const dateText = d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              return {
                id: s.id,
                studentName: studentMap[s.student_id]?.name || "Student Learner",
                started_at: s.started_at,
                ended_at: s.ended_at,
                durationText: duration,
                dateText,
                status: s.status,
                room_url: s.room_url || `/session/${s.id}`,
              };
            })
          );
        }

        // Fetch reviews for this teacher
        try {
          const { data: reviewsData } = await supabase
            .from("reviews")
            .select("student_rating")
            .eq("teacher_id", user.id)
            .not("student_rating", "is", null);

          if (reviewsData && reviewsData.length > 0) {
            const validRatings = reviewsData
              .map((r) => r.student_rating)
              .filter((r): r is number => typeof r === "number" && r > 0);

            if (validRatings.length > 0) {
              const avg = (
                validRatings.reduce((a, b) => a + b, 0) / validRatings.length
              ).toFixed(1);
              setAverageRating(avg);
              setRatingCount(validRatings.length);
            }
          }
        } catch (revErr) {
          console.warn("Reviews load warning:", revErr);
        }
      } catch (err) {
        console.error("Failed to load teacher dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTeacherProfile();
  }, [router, supabase]);

  // 2. Real-time Incoming Session Listener
  useEffect(() => {
    if (!profile?.id) return;

    // A. Broadcast Channel
    const broadcastChannel = supabase
      .channel(`teacher-sessions-${profile.id}`)
      .on("broadcast", { event: "session_request" }, (payload) => {
        const data = payload?.payload;
        if (data?.session_id) {
          setIncomingRequest({
            sessionId: data.session_id,
            studentId: data.student_id,
            studentName: data.student_name || "A Student",
            roomUrl: data.room_url || `/session/${data.session_id}`,
          });
          setIsModalOpen(true);
        }
      })
      .subscribe();

    // B. Postgres Changes Fallback Channel
    const dbChannel = supabase
      .channel(`db-sessions-for-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
          filter: `teacher_id=eq.${profile.id}`,
        },
        async (payload) => {
          const newSession = payload.new as Session;
          if (newSession && newSession.status === "pending") {
            const { data: studentProfile } = await supabase
              .from("profiles")
              .select("full_name, username")
              .eq("id", newSession.student_id)
              .single();

            setIncomingRequest({
              sessionId: newSession.id,
              studentId: newSession.student_id,
              studentName:
                studentProfile?.full_name || studentProfile?.username || "A Student",
              roomUrl: newSession.room_url,
            });
            setIsModalOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [profile?.id, supabase]);

  // 3. Handle Availability Toggle
  const handleToggleOnline = useCallback(
    async (nextState: boolean) => {
      if (!profile || isUpdatingStatus) return;

      const prevState = isOnline;
      setIsOnline(nextState);
      setIsUpdatingStatus(true);
      setStatusMessage(null);

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ is_online: nextState })
          .eq("id", profile.id);

        if (error) {
          throw error;
        }

        if (nextState) {
          setStatusMessage({
            type: "success",
            text: "You are now ONLINE. Students can see you and request sessions!",
          });
        } else {
          setStatusMessage({
            type: "neutral",
            text: "You are now OFFLINE. New session requests are paused.",
          });
        }

        setProfile((prev) => (prev ? { ...prev, is_online: nextState } : null));
      } catch {
        setIsOnline(prevState);
        setStatusMessage({
          type: "error",
          text: "Failed to update availability. Please try again.",
        });
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [profile, isOnline, isUpdatingStatus, supabase]
  );

  // 4. Accept Incoming Session
  const handleAcceptSession = async () => {
    if (!incomingRequest) return;
    setIsResponding(true);

    try {
      await supabase
        .from("sessions")
        .update({ status: "active" })
        .eq("id", incomingRequest.sessionId);

      setIsModalOpen(false);
      router.push(`/session/${incomingRequest.sessionId}`);
    } catch (err) {
      console.error("Error accepting session:", err);
    } finally {
      setIsResponding(false);
    }
  };

  // 5. Decline Incoming Session
  const handleDeclineSession = async () => {
    if (!incomingRequest) return;
    setIsResponding(true);

    try {
      await supabase
        .from("sessions")
        .update({ status: "cancelled" })
        .eq("id", incomingRequest.sessionId);

      setIncomingRequest(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error declining session:", err);
    } finally {
      setIsResponding(false);
    }
  };

  // 6. Skills Management
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim() || !profile) return;
    const trimmed = newSkillInput.trim();
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillInput("");
      return;
    }

    const updated = [...skills, trimmed];
    setSkills(updated);
    setNewSkillInput("");
    setIsSavingSkill(true);

    try {
      await supabase.from("profiles").update({ skills: updated }).eq("id", profile.id);
    } catch (err) {
      console.error("Failed to save skill:", err);
    } finally {
      setIsSavingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile) return;
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);

    try {
      await supabase.from("profiles").update({ skills: updated }).eq("id", profile.id);
    } catch (err) {
      console.error("Failed to remove skill:", err);
    }
  };

  // Calculate earnings ($45/hr rate = $0.75/min). Show realistic demonstration or actual
  const hourlyRate = 45;
  const estimatedTodaysEarnings = Math.max(0, todaysMinutesTaught * (hourlyRate / 60));

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-slate-500 font-mono">
          Loading command center...
        </span>
      </div>
    );
  }

  return (
    <DashboardShell
      role="teacher"
      userProfile={{
        id: profile?.id,
        fullName: profile?.full_name,
        username: profile?.username,
        email: email,
        role: "teacher",
        isOnline: isOnline,
        skills: skills,
      }}
      activeItem="dashboard"
      headerActions={
        <div className="flex items-center gap-3">
          {/* Notification Bell with Ping */}
          <button
            type="button"
            onClick={() => {
              if (incomingRequest) {
                setIsModalOpen(true);
              }
            }}
            className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
              incomingRequest
                ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            }`}
            title={
              incomingRequest
                ? "Incoming session call waiting!"
                : "No incoming requests"
            }
          >
            <Bell className="h-4.5 w-4.5" />
            {incomingRequest && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[10px] font-bold text-white items-center justify-center">
                  1
                </span>
              </span>
            )}
          </button>

          {/* Online beacon in header */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white border-slate-200">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">
              {isOnline ? "Online & Ready" : "Offline"}
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : statusMessage.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ================= 1. TOP SECTION: SATISFYING ONLINE/OFFLINE TOGGLE CARD ================= */}
        <div
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-6 sm:p-8 ${
            isOnline
              ? "bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/90 border-emerald-500/40 text-white shadow-md shadow-emerald-500/5"
              : "bg-white border-slate-200/90 text-slate-900 shadow-sm"
          }`}
        >
          {/* Subtle glow if online */}
          {isOnline && (
            <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          )}

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-3 w-3 rounded-full ${
                    isOnline ? "bg-emerald-400 animate-ping" : "bg-slate-300"
                  }`}
                />
                <span
                  className={`text-xs font-bold uppercase tracking-wider font-mono ${
                    isOnline ? "text-emerald-400" : "text-slate-400"
                  }`}
                >
                  Availability Status
                </span>
              </div>

              <h2
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isOnline ? "text-white" : "text-slate-900"
                }`}
              >
                {isOnline ? "You Are Online & Discoverable" : "You Are Currently Offline"}
              </h2>

              <p
                className={`text-xs sm:text-sm max-w-xl ${
                  isOnline ? "text-emerald-100/80" : "text-slate-500"
                }`}
              >
                {isOnline
                  ? "Students can see your profile on the Discover directory and call you for live 1-on-1 tutoring sessions."
                  : "Flip your status switch to Go Online when you are available to accept incoming video tutoring sessions."}
              </p>
            </div>

            {/* Prominent Satisfying Toggle Switch Button */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                role="switch"
                aria-checked={isOnline}
                disabled={isUpdatingStatus}
                onClick={() => handleToggleOnline(!isOnline)}
                className={`group relative inline-flex h-12 w-24 items-center rounded-full p-1.5 transition-all duration-300 ease-in-out cursor-pointer shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 ${
                  isOnline
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30"
                    : "bg-slate-200 hover:bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-9 w-9 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-out flex items-center justify-center ${
                    isOnline ? "translate-x-12" : "translate-x-0"
                  }`}
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  ) : isOnline ? (
                    <Zap className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                  )}
                </span>
              </button>

              <div className="flex flex-col">
                <span
                  className={`text-sm font-bold ${
                    isOnline ? "text-white" : "text-slate-800"
                  }`}
                >
                  {isOnline ? "Go Offline" : "Go Online"}
                </span>
                <span
                  className={`text-xs ${
                    isOnline ? "text-emerald-300" : "text-slate-400"
                  }`}
                >
                  {isOnline ? "Accepting calls" : "Paused"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. STATS ROW: THREE CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: Sessions Completed */}
          <Card className="p-6 bg-white border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Sessions Completed
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">
                {completedSessionsCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total completed 1-on-1 sessions
              </p>
            </div>
          </Card>

          {/* Card 2: Average Rating */}
          <Card className="p-6 bg-white border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Average Rating
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <Star className="h-5 w-5 fill-amber-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {averageRating || "5.0"}
                </span>
                <span className="text-xs font-bold text-amber-500">★ ★ ★ ★ ★</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {ratingCount > 0 ? `Based on ${ratingCount} reviews` : "Verified Top Mentor"}
              </p>
            </div>
          </Card>

          {/* Card 3: Total Minutes Taught */}
          <Card className="p-6 bg-white border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Total Minutes Taught
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">
                {totalMinutesTaught > 60
                  ? `${Math.floor(totalMinutesTaught / 60)}h ${totalMinutesTaught % 60}m`
                  : `${totalMinutesTaught} mins`}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Live instructional time delivered
              </p>
            </div>
          </Card>
        </div>

        {/* ================= 3. TODAY'S EARNINGS QUICK VIEW ================= */}
        <Card className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider font-mono">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span>Today&apos;s Earnings Overview</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">
                  ${estimatedTodaysEarnings > 0 ? estimatedTodaysEarnings.toFixed(2) : "0.00"}
                </span>
                <Badge variant="emerald" className="text-xs font-mono font-semibold">
                  Rate: ${hourlyRate}.00/hr
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {todaysMinutesTaught > 0
                  ? `${todaysMinutesTaught} minutes taught today. Next payout on Friday via Stripe Direct.`
                  : "No teaching minutes logged yet today. Turn on your toggle to start earning!"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/teacher/history">
                <Button variant="glass" size="sm" className="gap-1.5 text-white border-white/20 hover:bg-white/20">
                  <History className="h-4 w-4" />
                  <span>Session History</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* ================= 4. UPCOMING SCHEDULED SESSIONS ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Upcoming Scheduled Sessions
              </h2>
              {scheduledSessions.length > 0 && (
                <Badge variant="indigo" className="text-xs font-semibold">
                  {scheduledSessions.length} Booked
                </Badge>
              )}
            </div>
            <Link
              href="/teacher/availability"
              className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Manage Availability Slots</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {scheduledSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledSessions.map((session) => {
                const startMs = new Date(session.scheduled_start_time).getTime();
                const opensAtMs = startMs - 5 * 60 * 1000;
                const isJoinable = nowMs >= opensAtMs;
                const diffUntilOpen = Math.max(0, Math.floor((opensAtMs - nowMs) / 1000));

                const formatCountdown = (diffSeconds: number) => {
                  const days = Math.floor(diffSeconds / 86400);
                  const hours = Math.floor((diffSeconds % 86400) / 3600);
                  const minutes = Math.floor((diffSeconds % 3600) / 60);
                  const seconds = diffSeconds % 60;
                  if (days > 0) return `${days}d ${hours}h`;
                  if (hours > 0) return `${hours}h ${minutes}m`;
                  if (minutes > 0) return `${minutes}m ${seconds}s`;
                  return `${seconds}s`;
                };

                const formattedDate = new Date(session.scheduled_start_time).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const formattedTime = new Date(session.scheduled_start_time).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <Card
                    key={session.id}
                    className={`p-5 transition-all flex flex-col justify-between ${
                      isJoinable
                        ? "border-emerald-300 bg-emerald-50/20 shadow-sm"
                        : "border-slate-200/90 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        {isJoinable ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ready to Join
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Clock className="h-3 w-3" />
                            Opens in {formatCountdown(diffUntilOpen)}
                          </span>
                        )}

                        <span className="text-xs text-slate-500 font-mono">
                          {formattedDate}
                        </span>
                      </div>

                      <div className="mt-3.5">
                        <h4 className="font-bold text-slate-900 text-base truncate">
                          Student: {session.studentName}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{formattedTime}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100">
                      {isJoinable ? (
                        <Link href={session.room_url || `/session/${session.id}`} className="w-full">
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold shadow-xs cursor-pointer"
                          >
                            <Video className="h-4 w-4" />
                            <span>Join Video Call Now</span>
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="w-full gap-2 text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed text-xs font-medium"
                        >
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Opens 5m before start</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-6 text-center border-dashed border-slate-200 bg-white">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2.5">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No upcoming scheduled appointments
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Keep your availability slots up to date so students can book tutoring sessions in advance.
              </p>
              <Link href="/teacher/availability" className="inline-block mt-3">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Configure Availability</span>
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {/* ================= 5. RECENT SESSION REQUESTS & SESSIONS ================= */}
        <div id="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Live Requests &amp; Past Sessions
              </h2>
            </div>
            <Link
              href="/teacher/history"
              className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
            >
              <span>View All History</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Pending incoming request callout banner if active */}
          {incomingRequest && (
            <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-rose-600 text-white flex items-center justify-center animate-bounce">
                  <PhoneCall className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="rose" className="text-[10px] uppercase">
                      Incoming Call
                    </Badge>
                    <span className="text-xs text-rose-700 font-mono">Live Request</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    {incomingRequest.studentName} is requesting a tutoring session!
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeclineSession}
                  disabled={isResponding}
                  className="text-rose-600 border-rose-200 hover:bg-rose-100"
                >
                  Decline
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptSession}
                  disabled={isResponding}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                >
                  <Video className="h-4 w-4" />
                  <span>Accept &amp; Join Room</span>
                </Button>
              </div>
            </div>
          )}

          {/* Recent sessions list */}
          {recentSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSessions.map((session) => {
                const isCompleted = session.status === "completed";
                const isPending = session.status === "pending" || session.status === "active";

                return (
                  <Card
                    key={session.id}
                    className="p-5 border-slate-200/90 hover:border-slate-300 transition-all bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={isCompleted ? "emerald" : isPending ? "indigo" : "rose"}
                          className="capitalize text-xs font-semibold"
                        >
                          {session.status}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">
                          {session.dateText}
                        </span>
                      </div>

                      <div className="mt-3">
                        <h4 className="font-bold text-slate-900 text-base">
                          Student: {session.studentName}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{session.durationText}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {isPending ? (
                        <Link href={`/session/${session.id}`} className="w-full">
                          <Button variant="primary" size="sm" className="w-full gap-2 font-semibold">
                            <Video className="h-4 w-4" />
                            <span>Re-join Active Room</span>
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/teacher/history" className="w-full">
                          <Button variant="outline" size="sm" className="w-full text-slate-600 hover:text-indigo-600">
                            <span>View Session Log</span>
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Friendly Empty State */
            <Card className="p-8 sm:p-12 text-center border-dashed border-slate-200 bg-white">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 mb-3.5">
                <CalendarX2 className="h-7 w-7 text-indigo-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Session Requests Yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Make sure your availability toggle is set to &quot;Online&quot; at the top of the command center. Incoming student calls will trigger an immediate alert here.
              </p>
              {!isOnline && (
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleToggleOnline(true)}
                    className="gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Go Online Now</span>
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ================= 5. SKILLS & SPECIALTIES MANAGER ================= */}
        <Card className="p-6 bg-white border-slate-200/90">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  <span>Teaching Specialties &amp; Subjects</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Students discover you by searching these subject tags on the platform.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-indigo-400 hover:text-rose-600 rounded-md p-0.5"
                      title="Remove specialty"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  No specialties listed. Add subjects you can teach below!
                </span>
              )}
            </div>

            <form onSubmit={handleAddSkill} className="flex gap-2 max-w-md">
              <Input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="e.g. Python, Calculus, Organic Chemistry..."
                className="h-10 text-xs"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                isLoading={isSavingSkill}
                disabled={!newSkillInput.trim()}
                className="shrink-0 font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Subject
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ================= INCOMING SESSION MODAL ================= */}
      {isModalOpen && incomingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center animate-bounce">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Incoming Session Request
                  </h3>
                  <p className="text-xs text-slate-500">Live student connection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-center py-4 space-y-2">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
                {incomingRequest.studentName[0]?.toUpperCase() || "S"}
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                {incomingRequest.studentName}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Is ready to start a 1-on-1 video tutoring session with you right now.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={handleDeclineSession}
                disabled={isResponding}
                className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Decline
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleAcceptSession}
                isLoading={isResponding}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-sm"
              >
                <Video className="h-4 w-4" />
                <span>Accept &amp; Join</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
