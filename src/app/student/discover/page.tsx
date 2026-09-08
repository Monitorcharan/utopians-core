"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import {
  Zap,
  Search,
  Video,
  Star,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  Users,
} from "lucide-react";

// Harmonious chip colors for skills
const SKILL_CHIP_COLORS = [
  "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  "bg-violet-50 text-violet-700 border-violet-200/80",
  "bg-sky-50 text-sky-700 border-sky-200/80",
  "bg-amber-50 text-amber-700 border-amber-200/80",
  "bg-teal-50 text-teal-700 border-teal-200/80",
];

// Curated avatar gradient fallbacks
const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-amber-500 to-orange-600",
];

export default function StudentDiscoverPage() {
  const router = useRouter();
  const supabase = createClient();

  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [teacherRatings, setTeacherRatings] = useState<
    Record<string, { averageRating: number; reviewCount: number }>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [requestingTeacherId, setRequestingTeacherId] = useState<string | null>(
    null
  );

  // Toast notifications
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // 1. Fetch online teachers & review ratings
  useEffect(() => {
    async function fetchOnlineTeachers() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "teacher")
          .eq("is_online", true)
          .order("username", { ascending: true });

        if (error) {
          console.error("Error fetching online teachers:", error);
        } else if (data) {
          setTeachers(data as Profile[]);
        }
      } catch (err) {
        console.error("Unexpected error fetching teachers:", err);
      } finally {
        setIsLoading(false);
      }
    }

    async function loadTeacherRatings() {
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

          const formatted: Record<
            string,
            { averageRating: number; reviewCount: number }
          > = {};
          Object.keys(stats).forEach((teacherId) => {
            formatted[teacherId] = {
              averageRating: Number(
                (stats[teacherId].sum / stats[teacherId].count).toFixed(1)
              ),
              reviewCount: stats[teacherId].count,
            };
          });
          setTeacherRatings(formatted);
        }
      } catch (err) {
        console.warn("Could not fetch reviews:", err);
      }
    }

    fetchOnlineTeachers();
    loadTeacherRatings();

    // 2. Realtime listener for teacher presence updates
    const channel = supabase
      .channel("online-teachers-presence")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const updated = payload.new as Profile;

            if (updated.role === "teacher") {
              if (updated.is_online) {
                // Teacher went online -> add or update in list
                setTeachers((prev) => {
                  const existsIndex = prev.findIndex((t) => t.id === updated.id);
                  if (existsIndex >= 0) {
                    const next = [...prev];
                    next[existsIndex] = updated;
                    return next;
                  }
                  return [updated, ...prev];
                });
              } else {
                // Teacher went offline -> remove immediately from list
                setTeachers((prev) => prev.filter((t) => t.id !== updated.id));
              }
            }
          } else if (payload.eventType === "DELETE") {
            setTeachers((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Realtime listener for reviews table updates
    const reviewsChannel = supabase
      .channel("realtime-reviews-listener")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
        },
        () => {
          loadTeacherRatings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reviewsChannel);
    };
  }, [supabase]);

  // 3. Filter teachers by skill or name
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const query = searchQuery.toLowerCase().trim();

    return teachers.filter((teacher) => {
      const name = (teacher.full_name || teacher.username || "").toLowerCase();
      const hasSkill = teacher.skills?.some((skill) =>
        skill.toLowerCase().includes(query)
      );
      return name.includes(query) || hasSkill;
    });
  }, [teachers, searchQuery]);

  // 4. Handle session request
  const handleRequestSession = async (teacher: Profile) => {
    const teacherName = teacher.full_name || teacher.username || "Teacher";
    setRequestingTeacherId(teacher.id);

    try {
      // Authenticate current student
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        showToast("error", "Please log in to request a tutoring session.");
        router.push("/student/login");
        return;
      }

      // Fetch student display name
      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();

      const studentName =
        studentProfile?.full_name ||
        studentProfile?.username ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Student";

      // Create Jitsi Meet private room via API route
      const response = await fetch("/api/create-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacher.id,
          studentId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.roomUrl || !data.sessionId) {
        throw new Error(data.error || "Failed to create video room.");
      }

      // Cache room URL
      localStorage.setItem("room_url", data.roomUrl);

      // Broadcast event to teacher's personal channel
      const teacherChannel = supabase.channel(`teacher-sessions-${teacher.id}`);
      await teacherChannel.subscribe();
      await teacherChannel.send({
        type: "broadcast",
        event: "session_request",
        payload: {
          student_name: studentName,
          student_id: user.id,
          session_id: data.sessionId,
          room_url: data.roomUrl,
        },
      });

      showToast("success", `Request sent! Connecting with ${teacherName}...`);

      // Redirect student to video room
      router.push(`/session/${data.sessionId}`);
    } catch (err: unknown) {
      console.error("Session request failed:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while requesting the session.";
      showToast("error", errorMessage);
    } finally {
      setRequestingTeacherId(null);
    }
  };

  // Helper for avatar initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "TR";
  };

  // Deterministic gradient selection based on id
  const getGradientForId = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash + id.charCodeAt(i)) % AVATAR_GRADIENTS.length;
    }
    return AVATAR_GRADIENTS[hash];
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50/40 via-slate-50/30 to-white text-slate-900 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand & Identity */}
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
              Student Discovery
            </span>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>My Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Toast Feedback */}
        {toast && (
          <div
            className={`fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2.5 p-4 rounded-xl border text-sm shadow-lg transition-all animate-in fade-in slide-in-from-top-4 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 ml-2 text-xs font-semibold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Hero & Search Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700 font-mono shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Tutor Network &bull; On-Demand Matching</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Find an Online Teacher
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Connect instantly for 1-on-1 micro-tutoring sessions with verified
            mentors ready to help right now.
          </p>

          {/* Search Bar */}
          <div className="pt-2 max-w-lg mx-auto relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a skill..."
                className="w-full rounded-2xl border border-slate-200/90 bg-white pl-11 pr-10 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Results Count Pill */}
            {!isLoading && (
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-center gap-1.5 font-mono">
                <span>
                  {filteredTeachers.length}{" "}
                  {filteredTeachers.length === 1 ? "teacher" : "teachers"} online
                </span>
                {searchQuery && (
                  <span className="text-indigo-600 font-medium">
                    matching &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3, 4, 5, 6].map((sk) => (
              <div
                key={sk}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-slate-200 rounded-md" />
                    <div className="h-3 w-20 bg-slate-100 rounded-md" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-full bg-slate-100 rounded-md" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded-md" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 bg-slate-100 rounded-full" />
                  <div className="h-6 w-16 bg-slate-100 rounded-full" />
                </div>
                <div className="h-10 w-full bg-slate-200 rounded-xl pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTeachers.length === 0 && (
          <div className="py-16 text-center max-w-md mx-auto space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 mx-auto shadow-xs">
              <Users className="h-10 w-10 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                No teachers online right now. Try again later.
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {searchQuery
                  ? `No instructors currently match "${searchQuery}". Try clearing your search or checking back soon.`
                  : "Our verified instructors regularly log on throughout the day. Check back soon or request on-demand when one becomes available."}
              </p>
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-4"
              >
                Clear search query
              </button>
            )}
          </div>
        )}

        {/* Teachers Grid */}
        {!isLoading && filteredTeachers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredTeachers.map((teacher) => {
              const displayName =
                teacher.full_name || teacher.username || "Expert Tutor";
              const initials = getInitials(displayName);
              const gradientClass = getGradientForId(teacher.id);
              const isRequesting = requestingTeacherId === teacher.id;

              return (
                <div
                  key={teacher.id}
                  className="group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Top row: Avatar with Online Dot + Rating */}
                    <div className="flex items-start justify-between">
                      <div className="relative">
                        {teacher.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={teacher.avatar_url}
                            alt={displayName}
                            className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-xs"
                          />
                        ) : (
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr ${gradientClass} text-white font-bold text-lg shadow-xs border-2 border-white`}
                          >
                            {initials}
                          </div>
                        )}

                        {/* Green Dot indicating Online */}
                        <span
                          className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
                          title="Online now"
                        />
                      </div>

                      {/* Dynamic Rating / New Badge */}
                      {(() => {
                        const ratingInfo = teacherRatings[teacher.id];
                        if (ratingInfo && ratingInfo.reviewCount > 0) {
                          return (
                            <div className="inline-flex items-center gap-1 rounded-full bg-amber-50/80 border border-amber-200/60 px-2.5 py-0.5 text-xs font-semibold text-amber-800 shadow-2xs">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span>{ratingInfo.averageRating.toFixed(1)}</span>
                              <span className="text-[11px] text-amber-600 font-normal">
                                ({ratingInfo.reviewCount})
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 shadow-2xs">
                            <Sparkles className="h-3 w-3 text-emerald-500" />
                            <span>New</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Teacher Name & Short Tagline */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                        {displayName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Verified Mentor &bull; Live 1-on-1 Micro-Sessions
                      </p>
                    </div>

                    {/* Skills as Small Colored Chips */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                        Skills
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.skills && teacher.skills.length > 0 ? (
                          teacher.skills.map((skill, sIdx) => {
                            const color =
                              SKILL_CHIP_COLORS[
                                sIdx % SKILL_CHIP_COLORS.length
                              ];
                            return (
                              <span
                                key={skill}
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-2xs ${color}`}
                              >
                                {skill}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            General Academic &amp; Code Help
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prominent Indigo "Request Session" Button */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleRequestSession(teacher)}
                      disabled={isRequesting || requestingTeacherId !== null}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-500 hover:shadow-md transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {isRequesting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Creating Room...</span>
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4" />
                          <span>Request Session</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
