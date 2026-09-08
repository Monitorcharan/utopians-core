"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile, Session } from "@/types";
import {
  Zap,
  Bell,
  LogOut,
  X,
  Plus,
  PhoneCall,
  Video,
  CalendarX2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  Sparkles,
  History,
} from "lucide-react";

interface IncomingSessionRequest {
  sessionId: string;
  studentId: string;
  studentName: string;
  roomUrl: string;
}

// Harmonious chip color palette for teacher skills
const CHIP_COLORS = [
  "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  "bg-violet-50 text-violet-700 border-violet-200/80",
  "bg-sky-50 text-sky-700 border-sky-200/80",
  "bg-amber-50 text-amber-700 border-amber-200/80",
  "bg-teal-50 text-teal-700 border-teal-200/80",
];

export default function TeacherDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Profile & Status State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Status feedback toast/banner
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "neutral" | "error";
    text: string;
  } | null>(null);

  // Skills state
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [isSavingSkill, setIsSavingSkill] = useState(false);

  // Real-time Incoming Session Request Modal & Bell State
  const [incomingRequest, setIncomingRequest] =
    useState<IncomingSessionRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isResponding, setIsResponding] = useState<boolean>(false);

  // Session stats & recent logs state
  const [completedSessionsCount, setCompletedSessionsCount] =
    useState<number>(0);
  const [averageRating, setAverageRating] = useState<string | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [recentSessions, setRecentSessions] = useState<
    Array<{
      id: string;
      studentName: string;
      started_at: string;
      durationText: string;
      dateText: string;
      status: string;
    }>
  >([]);

  // 1. Fetch teacher profile & initial online status
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

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error loading profile:", profileError);
        }

        if (profileData) {
          setProfile(profileData);
          setIsOnline(profileData.is_online ?? false);
          setSkills(profileData.skills ?? []);
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

        // Fetch sessions & stats for this teacher
        const { data: teacherSessions } = await supabase
          .from("sessions")
          .select("id, started_at, ended_at, status, student_id")
          .eq("teacher_id", user.id)
          .order("started_at", { ascending: false });

        if (teacherSessions) {
          const completed = teacherSessions.filter(
            (s) => s.status === "completed"
          );
          setCompletedSessionsCount(completed.length);

          // Get top 3 recent sessions
          const recent = teacherSessions.slice(0, 3);
          const studentIds = Array.from(
            new Set(recent.map((r) => r.student_id).filter(Boolean))
          );
          let studentMap: Record<string, string> = {};
          if (studentIds.length > 0) {
            const { data: studentProfiles } = await supabase
              .from("profiles")
              .select("id, full_name, username")
              .in("id", studentIds);

            if (studentProfiles) {
              studentProfiles.forEach((st) => {
                studentMap[st.id] =
                  st.full_name || st.username || "Student";
              });
            }
          }

          setRecentSessions(
            recent.map((s) => {
              let duration = "Active";
              if (s.ended_at && s.started_at) {
                const diff = Math.max(
                  0,
                  Math.floor(
                    (new Date(s.ended_at).getTime() -
                      new Date(s.started_at).getTime()) /
                      1000
                  )
                );
                duration =
                  diff < 60 ? `${diff}s` : `${Math.round(diff / 60)}m`;
              }
              const d = new Date(s.started_at);
              const dateText = d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              return {
                id: s.id,
                studentName: studentMap[s.student_id] || "Student Learner",
                started_at: s.started_at,
                durationText: duration,
                dateText,
                status: s.status,
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
        } catch {
          // Graceful fallback if reviews table does not exist
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTeacherProfile();
  }, [router, supabase]);

  // 2. Realtime listeners for session requests targeting this teacher
  useEffect(() => {
    if (!profile?.id) return;

    // A. Broadcast Channel (Instant delivery from student)
    const broadcastChannel = supabase
      .channel(`teacher-sessions-${profile.id}`)
      .on("broadcast", { event: "session_request" }, (payload) => {
        const data = payload?.payload;
        if (data?.session_id && data?.room_url) {
          setIncomingRequest({
            sessionId: data.session_id,
            studentId: data.student_id,
            studentName: data.student_name || "A Student",
            roomUrl: data.room_url,
          });
          setIsModalOpen(true);
        }
      })
      .subscribe();

    // B. Database Changes Channel (Fallback on sessions table)
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
                studentProfile?.full_name ||
                studentProfile?.username ||
                "A Student",
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
      // Optimistic update
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
            text: "You are visible to students",
          });
        } else {
          setStatusMessage({
            type: "neutral",
            text: "You are offline",
          });
        }

        setProfile((prev) => (prev ? { ...prev, is_online: nextState } : null));
      } catch (err: unknown) {
        setIsOnline(prevState);
        const errText =
          err instanceof Error
            ? err.message
            : "Failed to update availability. Reverting status.";
        setStatusMessage({
          type: "error",
          text: errText,
        });
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [profile, isOnline, isUpdatingStatus, supabase]
  );

  // 4. Accept incoming session request
  const handleAcceptSession = async () => {
    if (!incomingRequest) return;
    setIsResponding(true);

    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status: "active" })
        .eq("id", incomingRequest.sessionId);

      if (error) {
        console.error("Failed to activate session:", error);
      }

      localStorage.setItem("room_url", incomingRequest.roomUrl);
      setIsModalOpen(false);
      router.push(`/session/${incomingRequest.sessionId}`);
    } catch (err) {
      console.error("Error accepting session:", err);
    } finally {
      setIsResponding(false);
    }
  };

  // 5. Decline incoming session request
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

  // 6. Skills management
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
      await supabase
        .from("profiles")
        .update({ skills: updated })
        .eq("id", profile.id);
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
      await supabase
        .from("profiles")
        .update({ skills: updated })
        .eq("id", profile.id);
    } catch (err) {
      console.error("Failed to remove skill:", err);
    }
  };

  // 7. Logout handler
  const handleLogout = async () => {
    if (profile?.id) {
      await supabase
        .from("profiles")
        .update({ is_online: false })
        .eq("id", profile.id);
    }
    await supabase.auth.signOut();
    router.push("/teacher/login");
  };

  // Extract initials for avatar fallback
  const displayName = profile?.full_name || profile?.username || "Teacher";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/60 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-slate-500 font-mono">
          Loading instructor dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="font-semibold text-slate-900 text-lg tracking-tight">
                Utopians<span className="text-indigo-600">Core</span>
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 font-mono">
              Teacher Portal
            </span>
          </div>

          {/* Header Actions: Notification Bell + Profile Info + Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell Icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (incomingRequest) {
                    setIsModalOpen(true);
                  }
                }}
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                  incomingRequest
                    ? "border-rose-300 bg-rose-50/50 text-rose-600 hover:bg-rose-100/60"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                }`}
                title={
                  incomingRequest
                    ? "Incoming session request pending! Click to review."
                    : "No pending session requests"
                }
                aria-label="Notification bell"
              >
                <Bell className="h-5 w-5" />

                {/* Pulsating Red Badge when session request arrives */}
                {incomingRequest && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[10px] font-bold text-white items-center justify-center">
                      1
                    </span>
                  </span>
                )}
              </button>
            </div>

            {/* Session History Link */}
            <Link
              href="/teacher/history"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Session History</span>
            </Link>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Status Toast Notification */}
        {statusMessage && (
          <div
            className={`flex items-center justify-between p-4 rounded-xl border text-sm transition-all duration-300 shadow-2xs ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : statusMessage.type === "neutral"
                ? "bg-slate-100 border-slate-200 text-slate-700"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : statusMessage.type === "neutral" ? (
                <div className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-semibold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Two-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Teacher Profile Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm transition-all">
              <div className="flex items-start gap-4">
                {/* Avatar / Initial */}
                {profile?.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-2xl shadow-xs shrink-0">
                    {initials || "T"}
                  </div>
                )}

                {/* Name & Contact Info */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate">
                      {displayName}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 truncate font-mono">
                    {email}
                  </p>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                    Verified Instructor
                  </span>

                  {/* Sessions Completed & Rating Stats */}
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-2xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{completedSessionsCount} Completed</span>
                    </span>

                    {averageRating ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-2xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{averageRating} ★ ({ratingCount})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                        <span>New Instructor</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills as Colored Chips */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                    Teaching Skills
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {skills.length} listed
                  </span>
                </div>

                {/* Chip Container */}
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? (
                    skills.map((skill, idx) => {
                      const colorClass =
                        CHIP_COLORS[idx % CHIP_COLORS.length];
                      return (
                        <span
                          key={skill}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-2xs transition-all ${colorClass}`}
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                            aria-label={`Remove skill ${skill}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No skills added yet. Add topics you teach below.
                    </p>
                  )}
                </div>

                {/* Add Skill Mini-Form */}
                <form onSubmit={handleAddSkill} className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Add skill (e.g. Next.js, Algebra)..."
                    disabled={isSavingSkill}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newSkillInput.trim() || isSavingSkill}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </button>
                </form>
              </div>
            </div>

            {/* 2. Large Satisfying "Go Online" Toggle Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm transition-all space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Go Online
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toggle your real-time availability for students
                  </p>
                </div>

                {/* State Badge */}
                {isOnline ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 font-mono shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>ONLINE</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 font-mono">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span>OFFLINE</span>
                  </span>
                )}
              </div>

              {/* Large Satisfying Toggle Switch */}
              <div className="pt-2 flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
                <div className="space-y-0.5 pr-4">
                  <div className="text-sm font-semibold text-slate-900">
                    {isOnline ? "You are visible to students" : "You are offline"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isOnline
                      ? "Students on discovery page can request sessions with you immediately."
                      : "Your profile is hidden from the active online tutor discovery feed."}
                  </div>
                </div>

                {/* Large Toggle Switch Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOnline}
                  disabled={isUpdatingStatus}
                  onClick={() => handleToggleOnline(!isOnline)}
                  className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 ${
                    isOnline
                      ? "bg-emerald-500 shadow-sm shadow-emerald-200"
                      : "bg-slate-300 hover:bg-slate-400/80"
                  }`}
                  aria-label="Toggle Online Status"
                >
                  {/* Thumb with Green Dot when On */}
                  <span
                    className={`pointer-events-none flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${
                      isOnline ? "translate-x-7" : "translate-x-0"
                    }`}
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" />
                    ) : isOnline ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="lg:col-span-7">
            {/* Recent Sessions Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm min-h-[460px] flex flex-col justify-between transition-all">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Recent Sessions
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your completed 1-on-1 tutoring calls &amp; history
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      {completedSessionsCount} Completed
                    </span>
                    <Link
                      href="/teacher/history"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-4"
                    >
                      View All &rarr;
                    </Link>
                  </div>
                </div>

                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 hover:bg-white hover:border-indigo-100 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-xs shrink-0">
                            {item.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {item.studentName}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {item.dateText} &bull; {item.durationText}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                              <span>{item.status}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 text-center">
                      <Link href="/teacher/history">
                        <button
                          type="button"
                          className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-indigo-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                        >
                          View Full Teaching History ({completedSessionsCount}) &rarr;
                        </button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Empty State Illustration & Content */
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50/80 border border-indigo-100/80 text-indigo-500 shadow-xs">
                      <CalendarX2 className="h-10 w-10 stroke-[1.5]" />
                    </div>

                    <div className="space-y-1.5 max-w-sm">
                      <h3 className="text-base font-bold text-slate-900">
                        No sessions yet.
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        When students request and complete live 1-on-1 tutoring sessions
                        with you, their room links, duration, and records will appear
                        here.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Guidance Card */}
              <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-600 flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                <p className="leading-relaxed">
                  <strong className="text-slate-900">Pro tip:</strong> Keep your
                  toggle set to <strong>Go Online</strong>. Students searching for
                  your skills on the discovery feed will see you immediately and can
                  send live video requests!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= INCOMING REQUEST MODAL ================= */}
      {incomingRequest && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Pulsing Call Animation */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-emerald-400 opacity-30" />
              <PhoneCall className="h-8 w-8 relative z-10" />
            </div>

            {/* Request Details */}
            <div className="space-y-2">
              <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                Incoming Live Request
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                {incomingRequest.studentName}
              </h3>
              <p className="text-sm text-slate-600">
                is requesting a live 1-on-1 tutoring session!
              </p>
            </div>

            {/* Room Identifier */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500 font-mono truncate">
              Session ID: {incomingRequest.sessionId}
            </div>

            {/* Action Buttons: Accept vs Decline */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeclineSession}
                disabled={isResponding}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                Decline
              </button>

              <button
                type="button"
                onClick={handleAcceptSession}
                disabled={isResponding}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-500 hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isResponding ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    <span>Accept</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
