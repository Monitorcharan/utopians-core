"use client";

import { BrandLoader } from "@/components/ui/brand-loader";

import { RoleWorkspace } from "@/components/layout/role-workspace";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Session, Profile } from "@/types";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Users,
  Search,
  Star,
  ExternalLink,
  Award,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TeacherSessionWithDetails extends Session {
  student?: Profile | null;
  studentRating?: number | null;
  studentComment?: string | null;
  teacherRating?: number | null;
  teacherComment?: string | null;
}

export default function TeacherHistoryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [sessions, setSessions] = useState<TeacherSessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Recording preview modal state
  const [recordingSession, setRecordingSession] =
    useState<TeacherSessionWithDetails | null>(null);

  useEffect(() => {
    async function loadTeacherHistory() {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/teacher/login");
          return;
        }

        // 1. Fetch all teacher sessions sorted most recent first
        const { data: sessionRows, error: sessionErr } = await supabase
          .from("sessions")
          .select("*")
          .eq("teacher_id", user.id)
          .order("started_at", { ascending: false });

        if (sessionErr) {
          console.error("Failed to load teacher sessions:", sessionErr);
          setIsLoading(false);
          return;
        }

        if (!sessionRows || sessionRows.length === 0) {
          setSessions([]);
          setIsLoading(false);
          return;
        }

        // 2. Fetch student profiles
        const studentIds = Array.from(
          new Set(sessionRows.map((s) => s.student_id).filter(Boolean))
        );

        const studentMap: Record<string, Profile> = {};
        if (studentIds.length > 0) {
          const { data: studentProfiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", studentIds);

          if (studentProfiles) {
            studentProfiles.forEach((st) => {
              studentMap[st.id] = st as Profile;
            });
          }
        }

        // 3. Fetch reviews if available
        const reviewMap: Record<
          string,
          {
            student_rating: number | null;
            student_comment: string | null;
            teacher_rating: number | null;
            teacher_comment: string | null;
          }
        > = {};
        try {
          const sessionIds = sessionRows.map((s) => s.id);
          const { data: reviewsData } = await supabase
            .from("reviews")
            .select("*")
            .in("session_id", sessionIds);

          if (reviewsData) {
            reviewsData.forEach((rev) => {
              reviewMap[rev.session_id] = {
                student_rating: rev.student_rating,
                student_comment: rev.student_comment,
                teacher_rating: rev.teacher_rating,
                teacher_comment: rev.teacher_comment,
              };
            });
          }
        } catch {
          // Graceful fallback if reviews table does not exist
        }

        // 4. Combine session details
        const combined: TeacherSessionWithDetails[] = sessionRows.map((s) => ({
          ...s,
          student: studentMap[s.student_id] || null,
          studentRating: reviewMap[s.id]?.student_rating ?? null,
          studentComment: reviewMap[s.id]?.student_comment ?? null,
          teacherRating: reviewMap[s.id]?.teacher_rating ?? null,
          teacherComment: reviewMap[s.id]?.teacher_comment ?? null,
        }));

        setSessions(combined);
      } catch (err) {
        console.error("Unexpected error fetching teacher history:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTeacherHistory();
  }, [router, supabase]);

  // Aggregate Stats Calculations
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.status === "completed"
    ).length;

    // Calculate total minutes taught for completed sessions
    let totalMinutesTaught = 0;
    sessions.forEach((s) => {
      if (s.status === "completed" && s.started_at && s.ended_at) {
        const start = new Date(s.started_at).getTime();
        const end = new Date(s.ended_at).getTime();
        const diffMinutes = Math.max(0, (end - start) / (1000 * 60));
        totalMinutesTaught += diffMinutes;
      }
    });

    // Calculate average rating
    const ratingsWithValues = sessions
      .map((s) => s.studentRating)
      .filter((r): r is number => typeof r === "number" && r > 0);

    const averageRating =
      ratingsWithValues.length > 0
        ? (
            ratingsWithValues.reduce((a, b) => a + b, 0) /
            ratingsWithValues.length
          ).toFixed(1)
        : null;

    return {
      totalSessions,
      completedSessions,
      totalMinutesTaught: Math.round(totalMinutesTaught),
      averageRating,
      ratingCount: ratingsWithValues.length,
    };
  }, [sessions]);

  // Duration Formatter
  const formatDuration = (startedAt: string, endedAt: string | null) => {
    if (!endedAt) return "In Progress";
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    const diffSeconds = Math.max(0, Math.floor((end - start) / 1000));

    if (diffSeconds < 60) return `${diffSeconds} secs`;
    const mins = Math.floor(diffSeconds / 60);
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} hr ${remMins > 0 ? `${remMins} mins` : ""}`;
  };

  // Date Formatter
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Status filter
      if (selectedStatus !== "all" && s.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const studentName = (
          s.student?.full_name ||
          s.student?.username ||
          ""
        ).toLowerCase();
        return studentName.includes(query);
      }
      return true;
    });
  }, [sessions, selectedStatus, searchQuery]);

  return (
    <RoleWorkspace role="teacher" activeItem="history">
      {/* Top Navigation */}

      {/* Main Container */}
      <section className="space-y-8">
        {/* Page Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Teaching History &amp; Logs
              </h1>
              <Badge variant="primary" size="sm">
                Instructor Console
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Overview of all 1-on-1 tutoring calls taught, student feedback, and cumulative teaching metrics.
            </p>
          </div>

          <Link href="/teacher/dashboard">
            <Button variant="primary" size="md" className="gap-2 shrink-0">
              <Video className="h-4 w-4" />
              <span>Go to Live Dashboard</span>
            </Button>
          </Link>
        </div>

        {/* Aggregate Stats Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Sessions */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                Total Sessions
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Video className="h-4 w-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalSessions}
            </div>
            <p className="text-[11px] text-slate-400">All tutoring invitations received</p>
          </div>

          {/* Card 2: Completed Sessions */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                Completed
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.completedSessions}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">
              Successfully finished sessions
            </p>
          </div>

          {/* Card 3: Total Minutes Taught */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                Minutes Taught
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {stats.totalMinutesTaught}{" "}
              <span className="text-sm font-normal text-slate-500">mins</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ~{(stats.totalMinutesTaught / 60).toFixed(1)} total hours
            </p>
          </div>

          {/* Card 4: Average Rating */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                Student Rating
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                <Award className="h-4 w-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              {stats.averageRating ? (
                <>
                  <Star className="h-6 w-6 fill-amber-400 text-amber-400 drop-shadow-xs" />
                  <span>{stats.averageRating}</span>
                </>
              ) : (
                <span className="text-lg text-emerald-600 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" /> New Instructor
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {stats.ratingCount > 0
                ? `From ${stats.ratingCount} student reviews`
                : "No reviews submitted yet"}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Sessions" },
              { id: "completed", label: "Completed" },
              { id: "active", label: "In Progress" },
              { id: "cancelled", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedStatus === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <BrandLoader compact label="Loading your session history" />
        ) : filteredSessions.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center max-w-md mx-auto space-y-4 rounded-2xl border border-dashed border-slate-200 bg-white p-8 shadow-xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mx-auto border border-indigo-100">
              <Users className="h-8 w-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {searchQuery || selectedStatus !== "all"
                  ? "No matching sessions found"
                  : "No sessions yet. Go online to start teaching!"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {searchQuery || selectedStatus !== "all"
                  ? "Try clearing your search query or selecting a different status filter."
                  : "Turn your knowledge into income. Toggle your status to Online in your dashboard to receive instant 1-on-1 tutoring requests."}
              </p>
            </div>
            <div className="pt-2">
              <Link href="/teacher/dashboard">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Video className="h-3.5 w-3.5" />
                  <span>Go Online Now</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Sessions List */
          <div className="grid grid-cols-1 gap-4">
            {filteredSessions.map((sessionItem) => {
              const studentName =
                sessionItem.student?.full_name ||
                sessionItem.student?.username ||
                "Student Learner";
              const durationText = formatDuration(
                sessionItem.started_at,
                sessionItem.ended_at
              );
              const dateText = formatDate(sessionItem.started_at);

              return (
                <div
                  key={sessionItem.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                >
                  {/* Left: Student Info & Date */}
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Avatar */}
                    {sessionItem.student?.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={sessionItem.student.avatar_url}
                        alt={studentName}
                        className="h-12 w-12 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold text-base shadow-xs shrink-0">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                          {studentName}
                        </h3>

                        {/* Status Badge */}
                        {sessionItem.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Completed</span>
                          </span>
                        ) : sessionItem.status === "cancelled" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            <XCircle className="h-3 w-3" />
                            <span>Cancelled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping" />
                            <span>Active</span>
                          </span>
                        )}

                        {/* Student Rating Badge */}
                        {sessionItem.studentRating && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>Student rated {sessionItem.studentRating} ★</span>
                          </span>
                        )}
                      </div>

                      {/* Date & Duration */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{dateText}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Duration: {durationText}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="font-semibold text-emerald-600 font-mono">
                          {sessionItem.amount != null
                            ? `Earned: $${Number(sessionItem.amount).toFixed(2)}`
                            : "Earned: $0.00"}
                        </span>
                      </div>

                      {/* Student Review Comment if any */}
                      {sessionItem.studentComment && (
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 max-w-xl">
                          Student feedback: &ldquo;{sessionItem.studentComment}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    {sessionItem.status === "active" ? (
                      <Link href={`/session/${sessionItem.id}`}>
                        <Button variant="primary" size="sm" className="gap-1.5">
                          <Video className="h-3.5 w-3.5" />
                          <span>Join Live Room</span>
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRecordingSession(sessionItem)}
                        className="gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50/60"
                      >
                        <PlayCircle className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Re-watch Recording</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recording Preview Modal */}
      {recordingSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-indigo-600" />
                  <span>Teaching Session Playback</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student:{" "}
                  <span className="font-semibold text-slate-800">
                    {recordingSession.student?.full_name ||
                      recordingSession.student?.username ||
                      "Learner"}
                  </span>{" "}
                  &bull; Recorded on {formatDate(recordingSession.started_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecordingSession(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                aria-label="Close recording preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player Area */}
            <div className="relative aspect-video rounded-xl bg-slate-950 flex flex-col items-center justify-center text-center p-6 border border-slate-800 overflow-hidden shadow-inner">
              <div className="space-y-3 max-w-sm text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 mx-auto animate-pulse">
                  <PlayCircle className="h-8 w-8 fill-current" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Cloud Archive Ready
                  </p>
                  <p className="text-xs text-slate-400">
                    Session duration:{" "}
                    {formatDuration(
                      recordingSession.started_at,
                      recordingSession.ended_at
                    )}
                    . High definition stream and audio capture preserved.
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href={recordingSession.room_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                  >
                    <span>Open Session Room</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRecordingSession(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </RoleWorkspace>
  );
}
