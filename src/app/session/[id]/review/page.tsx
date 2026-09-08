"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Zap,
  Star,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Fair",
  3: "Good & Helpful",
  4: "Very Good",
  5: "Exceptional / 5 Stars!",
};

export default function SessionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const sessionId = (params?.sessionId || params?.id) as string;

  const [userRole, setUserRole] = useState<"student" | "teacher">("student");
  const [peerName, setPeerName] = useState<string>("Peer");
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    async function loadSessionAndPeer() {
      if (!sessionId) return;
      setIsLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/");
          return;
        }

        // Get user role
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = (myProfile?.role as "student" | "teacher") || "student";
        setUserRole(role);

        // Fetch session record
        const { data: sessionData } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessionData) {
          // Find peer ID
          const peerId =
            role === "student"
              ? sessionData.teacher_id
              : sessionData.student_id;

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
                  (role === "student" ? "Teacher" : "Student")
              );
              setPeerAvatarUrl(peerProfile.avatar_url || null);
            }
          }
        }
      } catch (err) {
        console.error("Error loading session for review:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSessionAndPeer();
  }, [sessionId, router, supabase]);

  const currentDisplayRating = hoveredRating ?? rating;
  const isStudent = userRole === "student";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = { sessionId };
      if (isStudent) {
        payload.studentRating = rating;
        if (comment.trim()) payload.studentComment = comment.trim();
      } else {
        payload.teacherRating = rating;
        if (comment.trim()) payload.teacherComment = comment.trim();
      }

      await fetch("/api/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setIsSubmitted(true);
      setTimeout(() => {
        if (isStudent) {
          router.push("/student/history");
        } else {
          router.push("/teacher/history");
        }
      }, 1500);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (isStudent) {
      router.push("/student/dashboard");
    } else {
      router.push("/teacher/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading review form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex flex-col justify-between font-sans text-slate-900">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight">
            Utopians<span className="text-indigo-600">Core</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={handleSkip}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          Skip to Dashboard
        </button>
      </header>

      {/* Main Review Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-lg">
          <Card className="shadow-lg border-slate-200/90 p-6 sm:p-8 space-y-6">
            {isSubmitted ? (
              <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto border border-emerald-100 shadow-xs">
                  <CheckCircle2 className="h-8 w-8 stroke-[2]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Thank You for Your Feedback!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Your rating has been saved and your session history updated.
                  </p>
                </div>
                <div className="pt-2 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header & Avatar */}
                <div className="text-center space-y-3">
                  <div className="relative mx-auto inline-block">
                    {peerAvatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={peerAvatarUrl}
                        alt={peerName}
                        className="h-18 w-18 rounded-full object-cover border-2 border-white shadow-md mx-auto"
                      />
                    ) : (
                      <div className="flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-2xl shadow-md border-2 border-white mx-auto">
                        {peerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-2xs">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Badge variant="primary" size="sm" className="mb-1">
                      Session Completed
                    </Badge>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {isStudent
                        ? `How was your session with ${peerName}?`
                        : `Rate your session with ${peerName}`}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {isStudent
                        ? "Your review helps verify instructors and improves quality for all learners."
                        : "Rate student engagement to guide their learning milestones."}
                    </p>
                  </div>
                </div>

                {/* 5-Star Input */}
                <div className="space-y-2 text-center py-2 bg-slate-50/60 rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= currentDisplayRating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(null)}
                          className="p-1 text-slate-200 hover:scale-115 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md cursor-pointer"
                          aria-label={`Rate ${star} out of 5 stars`}
                        >
                          <Star
                            className={`h-9 w-9 transition-colors ${
                              isFilled
                                ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                                : "fill-transparent text-slate-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs font-semibold text-amber-800 bg-amber-50/80 border border-amber-200/60 inline-block px-3 py-0.5 rounded-full font-sans shadow-2xs">
                    {RATING_LABELS[currentDisplayRating] || `${currentDisplayRating} Stars`}
                  </p>
                </div>

                {/* Optional Comment */}
                <div className="space-y-1.5 text-left">
                  <label
                    htmlFor="review-comment-field"
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      <span>{isStudent ? "Leave a Review" : "Session Feedback Notes"}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Optional
                    </span>
                  </label>

                  <textarea
                    id="review-comment-field"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={400}
                    placeholder={
                      isStudent
                        ? "What did you learn? Was the tutor patient, clear, and helpful?..."
                        : "Notes on student comprehension, practice problems, or recommendations..."
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all resize-none"
                  />
                  <div className="flex justify-end text-[10px] text-slate-400 font-mono">
                    {comment.length}/400
                  </div>
                </div>

                {/* Submit & Skip Actions */}
                <div className="space-y-2.5 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full text-sm font-semibold"
                  >
                    <span>{isStudent ? "Submit Review" : "Submit Rating"}</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer text-center"
                  >
                    Skip &amp; Return to Dashboard
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Utopians Core &bull; Live On-Demand Mentorship Platform
      </footer>
    </div>
  );
}
