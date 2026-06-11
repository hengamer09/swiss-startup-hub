"use client";

import { useState, useEffect, useRef } from "react";
import { Star, X } from "lucide-react";

type Step = "select" | "review" | "bug" | "done";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselect?: "review";
}

export default function FeedbackModal({ isOpen, onClose, preselect }: FeedbackModalProps) {
  const [step, setStep] = useState<Step>(preselect === "review" ? "review" : "select");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [issueText, setIssueText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedType, setSubmittedType] = useState<"review" | "bug" | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = "feedback-modal-title";

  useEffect(() => {
    if (isOpen) {
      setStep(preselect === "review" ? "review" : "select");
      setRating(0);
      setHoverRating(0);
      setReviewText("");
      setIssueText("");
      setSubmittedType(null);
    }
  }, [isOpen, preselect]);

  useEffect(() => {
    if (step !== "done") return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [step, onClose]);

  // Trap focus inside the modal
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      if (focusable.length === 0) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, onClose]);

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
      setSubmittedType("review");
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
      setSubmittedType("bug");
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id={headingId} className="text-lg font-semibold text-zinc-900">
            {step === "select" && "Share Feedback"}
            {step === "review" && "Leave a Review"}
            {step === "bug" && "Report an Issue"}
            {step === "done" && "Thank You!"}
          </h2>
          <button
            onClick={() => (step === "review" || step === "bug") ? setStep("select") : onClose()}
            aria-label={step === "review" || step === "bug" ? "Back to feedback menu" : "Close feedback modal"}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors focus:outline-2 focus:outline-red-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {step === "select" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("review")}
              className="w-full rounded-lg border border-zinc-200 p-4 text-left transition-all hover:border-zinc-300 hover:bg-zinc-50 focus:outline-2 focus:outline-red-600"
            >
              <p className="font-medium text-zinc-900">✅ Leave a Review</p>
              <p className="text-sm text-zinc-500 mt-0.5">Rate your experience with the platform</p>
            </button>
            <button
              onClick={() => setStep("bug")}
              className="w-full rounded-lg border border-zinc-200 p-4 text-left transition-all hover:border-zinc-300 hover:bg-zinc-50 focus:outline-2 focus:outline-red-600"
            >
              <p className="font-medium text-zinc-900">🐛 Report an Issue</p>
              <p className="text-sm text-zinc-500 mt-0.5">Tell us what isn&apos;t working</p>
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-700 mb-2" id="rating-label">Your rating <span className="text-red-600">*</span></p>
              <div className="flex gap-1" role="group" aria-labelledby="rating-label">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                    aria-pressed={rating === star}
                    className="focus:outline-2 focus:outline-red-600 focus:rounded-sm"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="review-text" className="block text-sm font-medium text-zinc-700">
                Describe your experience{" "}
                <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="review-text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="Tell us what you think about the platform..."
              />
            </div>
            <div className="flex gap-3">
              {preselect !== "review" && (
                <button
                  onClick={() => setStep("select")}
                  className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors focus:outline-2 focus:outline-red-600"
                >
                  Back
                </button>
              )}
              <button
                onClick={submitReview}
                disabled={submitting || rating === 0}
                aria-disabled={submitting || rating === 0}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus:outline-2 focus:outline-red-800"
              >
                {submitting ? "Sending..." : "Send Review"}
              </button>
            </div>
          </div>
        )}

        {step === "bug" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="issue-text" className="block text-sm font-medium text-zinc-700">
                What isn&apos;t working? <span className="text-red-600" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <textarea
                id="issue-text"
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                rows={5}
                aria-required="true"
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="Describe the issue as clearly as possible..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("select")}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors focus:outline-2 focus:outline-red-600"
              >
                Back
              </button>
              <button
                onClick={submitBug}
                disabled={submitting || !issueText.trim()}
                aria-disabled={submitting || !issueText.trim()}
                className="flex-1 rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 disabled:opacity-50 transition-colors focus:outline-2 focus:outline-zinc-900"
              >
                {submitting ? "Sending..." : "Send Report"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 text-center">
            <p className="text-4xl mb-3" aria-hidden="true">🙏</p>
            <p className="text-zinc-700 font-medium">
              {submittedType === "review" ? "Thank you for your review!" : "Thank you for your report!"}
            </p>
            <p className="text-sm text-zinc-400 mt-1">This window will close automatically.</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-md border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors focus:outline-2 focus:outline-red-600"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
