"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Sparkles,
  Users,
  Video,
  Star,
  Clock,
  Calendar,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarX2,
  Compass,
  X,
  Plus,
} from "lucide-react";

interface OnlineTeacherCardProps {
  teacher: Profile;
  rating?: { averageRating: number; reviewCount: number };
  onConnect: (teacher: Profile) => void;
  isConnecting: boolean;
}

function OnlineTeacherCard({
  teacher,
  rating,
  onConnect,
  isConnecting,
}: OnlineTeacherCardProps) {
  const teacherName = teacher.full_name || teacher.username || "Mentor";
  const initials = teacherName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Card
      hoverEffect
      className="p-5 flex flex-col justify-between border-slate-200/90 hover:border-indigo-200 transition-all duration-200 bg-white"
    >
      <div>
        {/* Header: Avatar, Name, Online Status */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
              {initials}
            </div>
            <span
              className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5"
              title="Online now"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <h4 className="font-bold text-slate-900 text-base truncate">
                {teacherName}
              </h4>
              <Badge variant="emerald" className="text-[10px] py-0.5 px-1.5 shrink-0">
                Online
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono truncate">
              @{teacher.username || "teacher"}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-800">
                {rating?.averageRating ? rating.averageRating.toFixed(1) : "5.0"}
              </span>
              <span className="text-slate-400">
                ({rating?.reviewCount ? `${rating.reviewCount} reviews` : "New Mentor"})
              </span>
            </div>
          </div>
        </div>

        {/* Skills Pills */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Specialties
          </span>
          <div className="flex flex-wrap gap-1.5">
            {teacher.skills && teacher.skills.length > 0 ? (
              teacher.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium truncate max-w-[140px]"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">
                General Tutoring &amp; Coding
              </span>
            )}
            {teacher.skills && teacher.skills.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                +{teacher.skills.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onConnect(teacher)}
          isLoading={isConnecting}
          disabled={isConnecting}
          className="w-full gap-2 font-semibold shadow-xs"
        >
          <Video className="h-4 w-4" />
          <span>Connect Now</span>
        </Button>
      </div>
    </Card>
  );
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Student auth & profile
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Online teachers & search
  const [onlineTeachers, setOnlineTeachers] = useState<Profile[]>([]);
  const [teacherRatings, setTeacherRatings] = useState<
    Record<string, { averageRating: number; reviewCount: number }>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [requestingTeacherId, setRequestingTeacherId] = useState<string | null>(null);

  // Recent / Upcoming Sessions
  const [recentSessions, setRecentSessions] = useState<
    Array<{
      id: string;
      teacherName: string;
      started_at: string;
      ended_at: string | null;
      status: string;
      room_url: string;
    }>
  >([]);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);

  // Toast / feedback message
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Skills interest management
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isSavingSkill, setIsSavingSkill] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // 1. Load Student Auth & Profile
  useEffect(() => {
    async function loadStudentData() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/student/login");
          return;
        }

        setEmail(user.email || "");

        // Fetch student profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setSkills(profileData.skills || []);
        } else {
          const fallbackProfile: Profile = {
            id: user.id,
            username:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Student",
            full_name: user.user_metadata?.full_name || null,
            avatar_url: null,
            role: "student",
            is_online: true,
            skills: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(fallbackProfile);
        }

        // Fetch student sessions
        const { data: sessionRows } = await supabase
          .from("sessions")
          .select("id, teacher_id, started_at, ended_at, status, room_url")
          .eq("student_id", user.id)
          .order("started_at", { ascending: false })
          .limit(5);

        if (sessionRows && sessionRows.length > 0) {
          const teacherIds = Array.from(new Set(sessionRows.map((s) => s.teacher_id)));
          const { data: teacherProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, username")
            .in("id", teacherIds);

          const teacherMap: Record<string, string> = {};
          teacherProfiles?.forEach((t) => {
            teacherMap[t.id] = t.full_name || t.username || "Mentor";
          });

          setRecentSessions(
            sessionRows.map((s) => ({
              id: s.id,
              teacherName: teacherMap[s.teacher_id] || "Mentor",
              started_at: s.started_at,
              ended_at: s.ended_at,
              status: s.status,
              room_url: s.room_url,
            }))
          );

          const completed = sessionRows.filter((s) => s.status === "completed").length;
          setCompletedSessionsCount(completed);
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudentData();
  }, [router, supabase]);

  // 2. Fetch Online Teachers & Realtime presence
  useEffect(() => {
    async function fetchOnlineTeachers() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "teacher")
          .eq("is_online", true)
          .order("username", { ascending: true });

        if (!error && data) {
          setOnlineTeachers(data as Profile[]);
        }
      } catch (err) {
        console.error("Error fetching online teachers:", err);
      }
    }

    async function loadRatings() {
      try {
        const { data: reviewsData, error } = await supabase
          .from("reviews")
          .select("teacher_id, student_rating")
          .not("student_rating", "is", null);

        if (!error && reviewsData) {
          const stats: Record<string, { sum: number; count: number }> = {};
          reviewsData.forEach((rev) => {
            if (!rev.teacher_id || rev.student_rating == null) return;
            if (!stats[rev.teacher_id]) {
              stats[rev.teacher_id] = { sum: 0, count: 0 };
            }
            stats[rev.teacher_id].sum += rev.student_rating;
            stats[rev.teacher_id].count += 1;
          });

          const formatted: Record<string, { averageRating: number; reviewCount: number }> = {};
          Object.keys(stats).forEach((id) => {
            formatted[id] = {
              averageRating: Number((stats[id].sum / stats[id].count).toFixed(1)),
              reviewCount: stats[id].count,
            };
          });
          setTeacherRatings(formatted);
        }
      } catch (e) {
        console.warn("Reviews load warning:", e);
      }
    }

    fetchOnlineTeachers();
    loadRatings();

    // Subscribe to realtime profile changes for online teachers
    const channel = supabase
      .channel("student-dashboard-presence")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const updated = payload.new as Profile;
            if (updated.role === "teacher") {
              if (updated.is_online) {
                setOnlineTeachers((prev) => {
                  const idx = prev.findIndex((t) => t.id === updated.id);
                  if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = updated;
                    return next;
                  }
                  return [updated, ...prev];
                });
              } else {
                setOnlineTeachers((prev) => prev.filter((t) => t.id !== updated.id));
              }
            }
          } else if (payload.eventType === "DELETE") {
            setOnlineTeachers((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Filtered teachers by search query or topic tag
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return onlineTeachers;
    const q = searchQuery.toLowerCase().trim();
    return onlineTeachers.filter((t) => {
      const name = (t.full_name || t.username || "").toLowerCase();
      const hasSkill = t.skills?.some((s) => s.toLowerCase().includes(q));
      return name.includes(q) || hasSkill;
    });
  }, [onlineTeachers, searchQuery]);

  // Connect to teacher flow
  const handleConnectTeacher = async (teacher: Profile) => {
    setRequestingTeacherId(teacher.id);
    const teacherName = teacher.full_name || teacher.username || "Mentor";

    try {
      if (!profile?.id) {
        showToast("error", "Please log in to initiate a session.");
        router.push("/student/login");
        return;
      }

      // 1. Create WebRTC session record via API
      const res = await fetch("/api/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: profile.id,
          teacherId: teacher.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.sessionId) {
        throw new Error(data.error || "Failed to create video room");
      }

      // Broadcast event to teacher's personal channel
      const studentName = profile.full_name || profile.username || "Student";
      const teacherChannel = supabase.channel(`teacher-sessions-${teacher.id}`);
      await teacherChannel.subscribe();
      await teacherChannel.send({
        type: "broadcast",
        event: "session_request",
        payload: {
          student_name: studentName,
          student_id: profile.id,
          session_id: data.sessionId,
        },
      });

      showToast("success", `Connecting to ${teacherName}... Entering room.`);
      // Redirect to session room
      router.push(`/session/${data.sessionId}`);
    } catch (err: unknown) {
      console.error("Connect error:", err);
      const msg = err instanceof Error ? err.message : "Could not connect to mentor.";
      showToast("error", msg);
    } finally {
      setRequestingTeacherId(null);
    }
  };

  // Student skills update
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || !profile) return;
    const trimmed = newSkill.trim();
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkill("");
      return;
    }
    const updated = [...skills, trimmed];
    setSkills(updated);
    setNewSkill("");
    setIsSavingSkill(true);

    try {
      await supabase.from("profiles").update({ skills: updated }).eq("id", profile.id);
      showToast("success", `Added interest: ${trimmed}`);
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

  const studentDisplayName = profile?.full_name || profile?.username || "Student";

  const popularTopics = ["Python", "JavaScript", "Math", "React", "Calculus", "Physics"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-slate-500 font-mono">
          Loading student dashboard...
        </span>
      </div>
    );
  }

  return (
    <DashboardShell
      role="student"
      userProfile={{
        id: profile?.id,
        fullName: profile?.full_name,
        username: profile?.username,
        email: email,
        role: "student",
        isOnline: true,
        skills: skills,
      }}
      activeItem="sessions"
      headerActions={
        <Link href="/student/discover">
          <Button variant="primary" size="sm" className="gap-1.5 shadow-2xs">
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Explore Mentors</span>
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Toast alert */}
        {toast && (
          <div
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ================= 1. WELCOME HERO SECTION ================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white shadow-sm">
          {/* Subtle ambient decorative shapes */}
          <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/2 bottom-0 w-64 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>On-Demand Learning Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Hello, {studentDisplayName}! 👋
              </h1>
              <p className="text-sm sm:text-base text-indigo-200 font-normal leading-relaxed">
                Connect instantly with verified expert mentors for 1-on-1 guidance, live
                problem solving, and interactive whiteboarding.
              </p>
            </div>

            {/* Quick Stats Pill Cards */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 sm:p-4 min-w-[120px] text-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200 font-mono block">
                  Online Tutors
                </span>
                <span className="text-2xl font-extrabold text-white mt-1 block">
                  {onlineTeachers.length}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 sm:p-4 min-w-[120px] text-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200 font-mono block">
                  Completed
                </span>
                <span className="text-2xl font-extrabold text-white mt-1 block">
                  {completedSessionsCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. PROMINENT SEARCH BAR & QUICK TOPICS ================= */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search online teachers by name or subject (e.g. Python, Calculus, React)..."
              className="w-full h-12 sm:h-14 pl-12 pr-10 rounded-2xl border border-slate-200/90 bg-white shadow-sm text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Topic Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Popular Subjects:</span>
            {popularTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() =>
                  setSearchQuery((prev) => (prev === topic ? "" : topic))
                }
                className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  searchQuery.toLowerCase() === topic.toLowerCase()
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold"
                    : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* ================= 3. GRID OF ONLINE TEACHERS ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-bold text-slate-900">
                Online Mentors Ready to Help
              </h2>
              <Badge variant="emerald" className="text-xs font-semibold">
                {filteredTeachers.length} Available
              </Badge>
            </div>

            <Link
              href="/student/discover"
              className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {filteredTeachers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTeachers.map((teacher) => (
                <OnlineTeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  rating={teacherRatings[teacher.id]}
                  onConnect={handleConnectTeacher}
                  isConnecting={requestingTeacherId === teacher.id}
                />
              ))}
            </div>
          ) : (
            /* Friendly Empty State for Online Teachers */
            <Card className="p-8 sm:p-12 text-center border-dashed border-slate-300 bg-white">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {searchQuery ? "No teachers matching your search" : "No teachers online right now"}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1.5">
                {searchQuery
                  ? `We couldn't find any active mentors matching "${searchQuery}". Try clearing your filter or searching for another subject.`
                  : "Our instructors log on throughout the day. You can browse all instructor profiles or check back shortly!"}
              </p>
              {searchQuery ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              ) : (
                <Link href="/student/discover" className="inline-block mt-4">
                  <Button variant="primary" size="sm">
                    Browse All Teachers
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </div>

        {/* ================= 4. UPCOMING & RECENT SESSIONS SECTION ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Recent &amp; Upcoming Sessions
              </h2>
            </div>
            <Link
              href="/student/history"
              className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
            >
              <span>Full History</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSessions.map((session) => {
                const isPending = session.status === "pending" || session.status === "active";
                const isCompleted = session.status === "completed";

                return (
                  <Card
                    key={session.id}
                    className="p-5 border-slate-200/90 hover:border-slate-300 transition-all bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={
                            isCompleted ? "emerald" : isPending ? "indigo" : "rose"
                          }
                          className="capitalize text-xs font-semibold"
                        >
                          {session.status}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(session.started_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="mt-3">
                        <h4 className="font-bold text-slate-900 text-base">
                          Session with {session.teacherName}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(session.started_at).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {isPending ? (
                        <Link href={`/session/${session.id}`} className="w-full">
                          <Button variant="primary" size="sm" className="w-full gap-2 font-semibold">
                            <Video className="h-4 w-4" />
                            <span>Join Active Room</span>
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/student/history" className="w-full">
                          <Button variant="outline" size="sm" className="w-full text-slate-600 hover:text-indigo-600">
                            <span>View Review &amp; Details</span>
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Friendly Empty State with Illustration for Upcoming Sessions */
            <Card className="p-8 sm:p-10 text-center border-dashed border-slate-200 bg-white">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 mb-3.5">
                <CalendarX2 className="h-7 w-7 text-indigo-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Upcoming Sessions
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
                You don&apos;t have any scheduled sessions right now. Browse online mentors above and start your first session with a single click!
              </p>
              <div className="mt-4">
                <Link href="/student/discover">
                  <Button variant="primary" size="sm" className="gap-2">
                    <Compass className="h-4 w-4" />
                    <span>Find a Teacher</span>
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* ================= 5. LEARNING INTERESTS / SKILLS MANAGER ================= */}
        <Card className="p-6 bg-white border-slate-200/90">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  <span>Your Learning Interests</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Add topics and subjects you want to practice. Mentors can view these when matching with you.
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-rose-600 rounded-md p-0.5"
                      title="Remove skill"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  No learning interests added yet. Type a subject below!
                </span>
              )}
            </div>

            <form onSubmit={handleAddSkill} className="flex gap-2 max-w-md">
              <Input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. Rust, Linear Algebra, Machine Learning..."
                className="h-10 text-xs"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                isLoading={isSavingSkill}
                disabled={!newSkill.trim()}
                className="shrink-0 font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
