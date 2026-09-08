"use client";

import React, { useState } from "react";
import { Star, MessageSquare, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { rating?: number; comment?: string }) => Promise<void>;
  onSkip: () => Promise<void>;
  userRole: "student" | "teacher";
  peerName: string;
  peerAvatarUrl?: string | null;
}

const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Fair",
  3: "Good & Helpful",
  4: "Very Good",
  5: "Exceptional / 5 Stars!",
};

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onSubmit,
  onSkip,
  userRole,
  peerName,
  peerAvatarUrl,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentDisplayRating = hoveredRating ?? rating;
  const isStudent = userRole === "student";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSkipping) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating: rating > 0 ? rating : undefined,
        comment: comment.trim() || undefined,
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error("Failed to submit rating:", err);
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (isSubmitting || isSkipping) return;
    setIsSkipping(true);
    try {
      await onSkip();
    } catch (err) {
      console.error("Failed to skip rating:", err);
      setIsSkipping(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xl transition-all">
        {isSubmitted ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto shadow-xs border border-emerald-100">
              <CheckCircle2 className="h-8 w-8 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Thank You for Your Feedback!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Your review helps maintain high quality standards across Utopians Core.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header / Avatar */}
            <div className="text-center space-y-3">
              <div className="relative mx-auto inline-block">
                {peerAvatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={peerAvatarUrl}
                    alt={peerName}
                    className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md mx-auto"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xl shadow-md border-2 border-white mx-auto">
                    {peerName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="space-y-1">
                <h3
                  id="rating-modal-title"
                  className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
                >
                  {isStudent
                    ? `How was your session with ${peerName}?`
                    : `Rate your session with ${peerName}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {isStudent
                    ? "Leave a quick rating and review for your instructor."
                    : "Help guide your student's learning journey."}
                </p>
              </div>
            </div>

            {/* Star Rating Input */}
            <div className="space-y-2 text-center">
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
                        className={`h-8 w-8 transition-colors ${
                          isFilled
                            ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                            : "fill-transparent text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Rating text badge */}
              <p className="text-xs font-semibold text-amber-800 bg-amber-50/80 border border-amber-200/60 inline-block px-3 py-0.5 rounded-full font-sans shadow-2xs">
                {RATING_LABELS[currentDisplayRating] || `${currentDisplayRating} Stars`}
              </p>
            </div>

            {/* Optional Comment Textarea */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="review-comment"
                className="flex items-center justify-between text-xs font-semibold text-slate-700 select-none"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {isStudent ? "Comments or feedback" : "Notes on session"}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Optional
                </span>
              </label>

              <textarea
                id="review-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={400}
                placeholder={
                  isStudent
                    ? "What did you learn? Was the mentor clear and helpful?..."
                    : "Notes on student engagement, topics covered, or next steps..."
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all resize-none"
              />
              <div className="flex justify-end text-[10px] text-slate-400 font-mono">
                {comment.length}/400
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={isSubmitting || isSkipping}
                className="w-full"
              >
                {isStudent ? "Submit Review" : "Submit Rating"}
              </Button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting || isSkipping}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer text-center"
              >
                {isSkipping ? "Skipping..." : "Skip & Return to Dashboard"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
