"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile, Review, AvailabilitySlot } from "@/types";
import {
  Zap,
  Star,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  Video,
  ArrowLeft,
  Loader2,
  AlertCircle,
  User as UserIcon,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface ReviewWithStudent extends Review {
  student?: {
    id: string;
    full_name: string | null;
    username: string;
    avatar_url: string | null;
  } | null;
}

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const teacherId = params?.id as string;

  const [teacher, setTeacher] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: "student" | "teacher";
    name: string;
  } | null>(null);

  const [reviews, setReviews] = useState<ReviewWithStudent[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Booking states
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [isInstantCalling, setIsInstantCalling] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Load teacher details, reviews, stats & available slots
  const loadProfileData = useCallback(async () => {
    if (!teacherId) return;

    try {
      // 1. Current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userProf } = await supabase
          .from("profiles")
          .select("role, full_name, username")
          .eq("id", user.id)
          .single();

        setCurrentUser({
          id: user.id,
          role: (userProf?.role as "student" | "teacher") || "student",
          name:
            userProf?.full_name ||
            userProf?.username ||
            user.email?.split("@")[0] ||
            "User",
        });
      }

      // 2. Fetch Teacher Profile
      const { data: teacherData, error: teacherError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", teacherId)
        .single();

      if (teacherError || !teacherData) {
        console.error("Teacher not found:", teacherError);
        setIsLoading(false);
        return;
      }

      setTeacher(teacherData as Profile);

      // 3. Fetch Completed Sessions Count
      const { count: sessionCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", teacherId)
        .eq("status", "completed");

      setCompletedSessionsCount(sessionCount || 0);

      // 4. Fetch Reviews for this teacher
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`
          *,
          student:profiles!reviews_student_id_fkey(id, full_name, username, avatar_url)
        `)
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });

      if (reviewsData) {
        setReviews(reviewsData as ReviewWithStudent[]);
      }

      // 5. Fetch Availability Slots
      const slotRes = await fetch(`/api/availability?teacherId=${teacherId}`);
      if (slotRes.ok) {
        const slotData = await slotRes.json();
        setSlots(slotData.slots || []);
      }
    } catch (err) {
      console.error("Error loading teacher profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, supabase]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Calculate Average Rating
  const validRatings = reviews
    .map((r) => r.student_rating)
    .filter((rating): rating is number => typeof rating === "number" && rating > 0);

  const averageRating =
    validRatings.length > 0
      ? validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length
      : 5.0;

  // Handle Booking Scheduled Slot
  const handleBookSlot = async (slotId: string) => {
    if (!currentUser) {
      router.push(`/student/login?redirect=/teacher/${teacherId}`);
      return;
    }

    if (currentUser.role === "teacher") {
      showToast("error", "You are logged in as a teacher. Only students can book sessions.");
      return;
    }

    setBookingSlotId(slotId);
    try {
      const res = await fetch("/api/book-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          teacherId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to book session");
      }

      showToast("success", "Session booked successfully! Redirecting to dashboard...");
      // Remove slot from local view
      setSlots((prev) => prev.filter((s) => s.id !== slotId));

      setTimeout(() => {
        router.push("/student/dashboard");
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Booking failed";
      showToast("error", msg);
    } finally {
      setBookingSlotId(null);
    }
  };

  // Handle Instant Call Request (same as discover page)
  const handleInstantCall = async () => {
    if (!teacher || !teacher.is_online) return;

    if (!currentUser) {
      router.push(`/student/login?redirect=/teacher/${teacherId}`);
      return;
    }

    if (currentUser.role === "teacher") {
      showToast("error", "Only students can initiate live tutoring requests.");
      return;
    }

    setIsInstantCalling(true);
    try {
      // 1. Create Room & Session record
      const res = await fetch("/api/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUser.id,
          teacherId: teacher.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.sessionId) {
        throw new Error(data.error || "Failed to create session");
      }

      // 2. Broadcast to teacher's personal channel
      const teacherChannel = supabase.channel(`teacher-sessions-${teacher.id}`);
      await teacherChannel.subscribe();
      await teacherChannel.send({
        type: "broadcast",
        event: "session_request",
        payload: {
          student_name: currentUser.name,
          student_id: currentUser.id,
          session_id: data.sessionId,
        },
      });

      showToast("success", `Connecting with ${teacher.full_name || "Instructor"}...`);
      router.push(`/session/${data.sessionId}`);
    } catch (err: unknown) {
      console.error("Instant call error:", err);
      const msg = err instanceof Error ? err.message : "Failed to connect to mentor";
      showToast("error", msg);
    } finally {
      setIsInstantCalling(false);
    }
  };

  const formatSlotDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatSlotTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const memberSinceYear = teacher?.created_at
    ? new Date(teacher.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "2026";

  const teacherName = teacher?.full_name || teacher?.username || "Instructor";
  const teacherInitials = teacherName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-xs font-mono text-slate-500">Loading teacher profile...</span>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
        <h1 className="text-xl font-bold text-slate-900">Teacher Not Found</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mb-6">
          The requested instructor profile does not exist or has been removed.
        </p>
        <Link
          href="/student/discover"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Discover</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/student/discover"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Online Mentors</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight hidden sm:inline">
              Utopians<span className="text-indigo-600">Core</span>
            </span>
          </Link>

          <div>
            {currentUser ? (
              <Link
                href={currentUser.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 bg-indigo-50/70 border border-indigo-100 rounded-lg px-3 py-1.5 transition-colors"
              >
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <Link
                href={`/student/login?redirect=/teacher/${teacherId}`}
                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl px-3.5 py-1.5 shadow-xs transition-colors"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO PROFILE CARD */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          {/* Subtle gradient banner accent */}
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 opacity-90" />

          <div className="relative pt-6 sm:pt-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            {/* Avatar with Status indicator */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              <div className="relative">
                {teacher.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={teacher.avatar_url}
                    alt={teacherName}
                    className="h-28 w-28 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-3xl shadow-xl border-4 border-white">
                    {teacherInitials}
                  </div>
                )}

                {/* Online status indicator */}
                <span
                  className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-3 border-white shadow-xs ${
                    teacher.is_online ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                  title={teacher.is_online ? "Online Now" : "Currently Offline"}
                />
              </div>

              {/* Name, Badges & Tagline */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {teacherName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-bold text-indigo-700 font-mono">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                    Verified Instructor
                  </span>
                  {teacher.is_online && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700 font-mono">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Online Now
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-500 font-mono">
                  @{teacher.username} &bull; Member since {memberSinceYear}
                </p>
              </div>
            </div>

            {/* Instant Call CTA */}
            <div className="shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleInstantCall}
                disabled={!teacher.is_online || isInstantCalling}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                  teacher.is_online
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 hover:scale-[1.02]"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
              >
                {isInstantCalling ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                <span>
                  {teacher.is_online
                    ? "Request Instant 1-on-1 Session"
                    : "Teacher is currently offline"}
                </span>
              </button>
            </div>
          </div>

          {/* Teacher Bio */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
              About Mentor
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl whitespace-pre-line">
              {teacher.bio ||
                "Experienced software engineer and instructor dedicated to guiding students through hands-on problem solving, code reviews, and live concept explanations."}
            </p>
          </div>

          {/* Skills Chips */}
          {teacher.skills && teacher.skills.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Expertise & Skills
              </h2>
              <div className="flex flex-wrap gap-2 pt-1">
                {teacher.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50/80 text-indigo-700 border border-indigo-100 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-base font-extrabold text-slate-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {reviews.length} Student Review{reviews.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-base font-extrabold text-slate-900">
                  {completedSessionsCount}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Completed Sessions
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-slate-700 mb-1">
                <Clock className="h-4 w-4 text-indigo-500" />
                <span className="text-base font-extrabold text-slate-900">
                  {memberSinceYear}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Active Mentor
              </span>
            </div>
          </div>
        </div>

        {/* 3. AVAILABLE TIME SLOTS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Available Time Slots
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {slots.length} upcoming slot{slots.length === 1 ? "" : "s"}
            </span>
          </div>

          {slots.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/90 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No scheduled time slots available</h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                This instructor currently has no open booking slots. If they are online, you can request an instant 1-on-1 session using the button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slots.map((slot) => {
                const isBooking = bookingSlotId === slot.id;
                const duration = Math.round(
                  (new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / 60000
                );

                return (
                  <div
                    key={slot.id}
                    className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold font-mono">
                          <Calendar className="h-3 w-3" />
                          {formatSlotDate(slot.start_time)}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 font-medium">
                          {duration} mins
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-base font-bold text-slate-900 tracking-tight pt-1">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>
                          {formatSlotTime(slot.start_time)} – {formatSlotTime(slot.end_time)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookSlot(slot.id)}
                      disabled={isBooking}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {isBooking ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <CalendarDays className="h-4 w-4" />
                      )}
                      <span>Book Session</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. REVIEWS SECTION */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Student Reviews ({reviews.length})
              </h2>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/90 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                <Star className="h-6 w-6 fill-current" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No reviews yet</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Be the first student to learn with {teacherName} and leave feedback after your session!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => {
                const sName =
                  rev.student?.full_name || rev.student?.username || "Verified Student";
                const sInitials = sName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();
                const reviewDate = new Date(rev.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        {rev.student?.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={rev.student.avatar_url}
                            alt={sName}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                            {sInitials}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{sName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {reviewDate}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < (rev.student_rating || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment text */}
                    {rev.student_comment && (
                      <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                        &ldquo;{rev.student_comment}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
