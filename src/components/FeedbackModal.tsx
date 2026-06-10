"use client";

import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";

type Step = "select" | "review" | "bug" | "done";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  // When "review" is passed, skip the selection step and go straight to review
  preselect?: "review";
}

export default function FeedbackModal({ isOpen, onClose, preselect }: FeedbackModalProps) {
  const [step, setStep] = useState<Step>(preselect === "review" ? "review" : "select");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [issueText, setIssueText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(preselect === "review" ? "review" : "select");
      setRating(0);
      setHoverRating(0);
      setReviewText("");
      setIssueText("");
    }
  }, [isOpen, preselect]);

  // Auto-close after showing confirmation for 3 seconds
  useEffect(() => {
    if (step !== "done") return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [step, onClose]);

  if (!isOpen) return null;

  async function submitReview() {
    if (submitting || rating === 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "review", rating, reviewText }),
      });
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBug() {
    if (submitting || !issueText.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bug", issueText }),
      });
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            {step === "select" && "Share Feedback"}
            {step === "review" && "Leave a Review"}
            {step === "bug" && "Report an Issue"}
            {step === "done" && "Thank You!"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "select" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("review")}
              className="w-full rounded-xl border-2 border-zinc-200 p-4 text-left transition-all hover:border-fuchsia-400 hover:bg-fuchsia-50"
            >
              <p className="font-medium text-zinc-900">✅ Leave a Review</p>
              <p className="text-sm text-zinc-500 mt-0.5">I want to rate my experience</p>
            </button>
            <button
              onClick={() => setStep("bug")}
              className="w-full rounded-xl border-2 border-zinc-200 p-4 text-left transition-all hover:border-amber-400 hover:bg-amber-50"
            >
              <p className="font-medium text-zinc-900">🐛 Report an Issue</p>
              <p className="text-sm text-zinc-500 mt-0.5">Something isn&apos;t working</p>
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-700 mb-2">Your rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Describe your experience{" "}
                <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                placeholder="Tell us what you think about the platform..."
              />
            </div>
            <div className="flex gap-3">
              {preselect !== "review" && (
                <button
                  onClick={() => setStep("select")}
                  className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={submitReview}
                disabled={submitting || rating === 0}
                className="flex-1 rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-600 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Sending..." : "Send Review"}
              </button>
            </div>
          </div>
        )}

        {step === "bug" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                What isn&apos;t working? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                rows={5}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Describe the issue as clearly as possible..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("select")}
                className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={submitBug}
                disabled={submitting || !issueText.trim()}
                className="flex-1 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Sending..." : "Send Report"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 text-center">
            <p className="text-4xl mb-3">🙏</p>
            <p className="text-zinc-700 font-medium">Thank you! Your feedback has been sent.</p>
            <p className="text-sm text-zinc-400 mt-1">This window will close automatically.</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
