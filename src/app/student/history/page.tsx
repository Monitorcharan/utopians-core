"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Session, Profile } from "@/types";
import {
  Zap,
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Users,
  Search,
  Loader2,
  Star,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SessionWithDetails extends Session {
  teacher?: Profile | null;
  studentRating?: number | null;
  studentComment?: string | null;
}

export default function StudentHistoryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Recording preview modal state
  const [recordingSession, setRecordingSession] =
    useState<SessionWithDetails | null>(null);

  useEffect(() => {
    async function loadStudentHistory() {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/student/login");
          return;
        }

        // 1. Fetch all student sessions sorted most recent first
        const { data: sessionRows, error: sessionErr } = await supabase
          .from("sessions")
          .select("*")
          .eq("student_id", user.id)
          .order("started_at", { ascending: false });

        if (sessionErr) {
          console.error("Failed to load student sessions:", sessionErr);
          setIsLoading(false);
          return;
        }

        if (!sessionRows || sessionRows.length === 0) {
          setSessions([]);
          setIsLoading(false);
          return;
        }

        // 2. Fetch teacher profiles
        const teacherIds = Array.from(
          new Set(sessionRows.map((s) => s.teacher_id).filter(Boolean))
        );

        let teacherMap: Record<string, Profile> = {};
        if (teacherIds.length > 0) {
          const { data: teacherProfiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", teacherIds);

          if (teacherProfiles) {
            teacherProfiles.forEach((t) => {
              teacherMap[t.id] = t as Profile;
            });
          }
        }

        // 3. Fetch reviews if available
        let reviewMap: Record<
          string,
          { student_rating: number | null; student_comment: string | null }
        > = {};
        try {
          const sessionIds = sessionRows.map((s) => s.id);
          const { data: reviewsData } = await supabase
            .from("reviews")
            .select("session_id, student_rating, student_comment")
            .in("session_id", sessionIds);

          if (reviewsData) {
            reviewsData.forEach((rev) => {
              reviewMap[rev.session_id] = {
                student_rating: rev.student_rating,
                student_comment: rev.student_comment,
              };
            });
          }
        } catch {
          // Graceful fallback if reviews table does not exist
        }

        // 4. Combine session details
        const combined: SessionWithDetails[] = sessionRows.map((s) => ({
          ...s,
          teacher: teacherMap[s.teacher_id] || null,
          studentRating: reviewMap[s.id]?.student_rating ?? null,
          studentComment: reviewMap[s.id]?.student_comment ?? null,
        }));

        setSessions(combined);
      } catch (err) {
        console.error("Unexpected error fetching history:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudentHistory();
  }, [router, supabase]);

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
        const teacherName = (
          s.teacher?.full_name ||
          s.teacher?.username ||
          ""
        ).toLowerCase();
        const skillsMatch = s.teacher?.skills?.some((sk) =>
          sk.toLowerCase().includes(query)
        );
        return teacherName.includes(query) || skillsMatch;
      }
      return true;
    });
  }, [sessions, selectedStatus, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 pb-16">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <span className="font-bold text-slate-900 text-base tracking-tight hidden sm:inline">
                Utopians<span className="text-indigo-600">Core</span>
              </span>
            </Link>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              Student Session History
            </span>
          </div>

          <Link href="/student/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Page Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Learning History
              </h1>
              <Badge variant="primary" size="sm">
                {sessions.length}{" "}
                {sessions.length === 1 ? "Session" : "Sessions"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              View your past 1-on-1 tutoring calls, review durations, and replay session recordings.
            </p>
          </div>

          <Link href="/student/discover">
            <Button variant="primary" size="md" className="gap-2 shrink-0">
              <Video className="h-4 w-4" />
              <span>Find New Teacher</span>
            </Button>
          </Link>
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
              placeholder="Search by teacher..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500 font-mono">
              Loading your session history...
            </p>
          </div>
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
                  : "No sessions yet. Find a teacher and start learning!"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {searchQuery || selectedStatus !== "all"
                  ? "Try clearing your search query or selecting a different status filter."
                  : "Connect with expert mentors online right now for live, on-demand micro-tutoring."}
              </p>
            </div>
            <div className="pt-2">
              <Link href="/student/discover">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Video className="h-3.5 w-3.5" />
                  <span>Browse Online Mentors</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Sessions List */
          <div className="grid grid-cols-1 gap-4">
            {filteredSessions.map((sessionItem) => {
              const teacherName =
                sessionItem.teacher?.full_name ||
                sessionItem.teacher?.username ||
                "Verified Instructor";
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
                  {/* Left: Teacher Info & Date */}
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Avatar */}
                    {sessionItem.teacher?.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={sessionItem.teacher.avatar_url}
                        alt={teacherName}
                        className="h-12 w-12 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-base shadow-xs shrink-0">
                        {teacherName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                          {teacherName}
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

                        {/* Student Rating Pill if reviewed */}
                        {sessionItem.studentRating && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>{sessionItem.studentRating} ★</span>
                          </span>
                        )}
                      </div>

                      {/* Date & Duration Info */}
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
                      </div>

                      {/* Student Review Comment if any */}
                      {sessionItem.studentComment && (
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 max-w-xl">
                          &ldquo;{sessionItem.studentComment}&rdquo;
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
                          <span>Rejoin Room</span>
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
      </main>

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
                  <span>Session Playback Recording</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mentor:{" "}
                  <span className="font-semibold text-slate-800">
                    {recordingSession.teacher?.full_name ||
                      recordingSession.teacher?.username ||
                      "Verified Instructor"}
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
                    Cloud Recording Ready
                  </p>
                  <p className="text-xs text-slate-400">
                    Session duration:{" "}
                    {formatDuration(
                      recordingSession.started_at,
                      recordingSession.ended_at
                    )}
                    . Full HD audio and screen capture archived.
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href={recordingSession.room_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                  >
                    <span>Open in Daily.co Archive</span>
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
    </div>
  );
}
