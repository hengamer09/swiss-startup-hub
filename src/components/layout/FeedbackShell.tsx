"use client";

import { useEffect, useState } from "react";
import { Bug, Star, X } from "lucide-react";
import SessionProvider from "@/components/layout/SessionProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type FeedbackType = "review" | "problem";

export default function FeedbackShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;

    const timer = window.setTimeout(() => setToastOpen(false), 3000);
    return () => window.clearTimeout(timer);
  }, [toastOpen]);

  return (
    <SessionProvider>
      <button
        onClick={() => setOpen(true)}
        className="w-full border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100"
      >
        Prototype preview - core features are being refined before the full release.
      </button>
      <Navbar onFeedback={() => setOpen(true)} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      {open && (
        <FeedbackModal
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            setToastOpen(true);
          }}
        />
      )}
      {toastOpen && (
        <div className="fixed bottom-4 right-4 z-[70] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-lg">
          Thank you for your feedback!
        </div>
      )}
    </SessionProvider>
  );
}

function FeedbackModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [type, setType] = useState<FeedbackType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type || loading) return;
    if (type === "review" && rating === 0) return;
    if (!content.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          email,
          rating,
          content,
        }),
      });

      if (res.ok) {
        onSuccess();
        return;
      }

      setError("Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900">Feedback</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close feedback"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!type ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setType("review")}
              className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-left transition-colors hover:bg-amber-100"
            >
              <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
              <div className="mt-3 text-base font-semibold text-zinc-900">
                Leave a Review
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                Share what you think about the platform.
              </p>
            </button>
            <button
              onClick={() => setType("problem")}
              className="rounded-xl border border-sky-200 bg-sky-50 p-5 text-left transition-colors hover:bg-sky-100"
            >
              <Bug className="h-7 w-7 text-sky-600" />
              <div className="mt-3 text-base font-semibold text-zinc-900">
                Report a Problem
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                Tell us what is not working.
              </p>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setType(null);
                  setContent("");
                  setRating(0);
                  setError("");
                }}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
              >
                Back
              </button>
              <span className="text-sm text-zinc-300">/</span>
              <span className="text-sm font-semibold text-zinc-900">
                {type === "review" ? "Leave a Review" : "Report a Problem"}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                  placeholder="Optional"
                />
              </div>
            </div>

            {type === "review" && (
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Star rating
                </label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                      aria-label={`${star} stars`}
                    >
                      <Star
                        className={cn(
                          "h-8 w-8",
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-none text-zinc-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700">
                {type === "review" ? "Review" : "Problem description"}
              </label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                placeholder={
                  type === "review"
                    ? "What do you think about the platform?"
                    : "Describe what is not working..."
                }
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !content.trim() || (type === "review" && rating === 0)}
                className="rounded-full bg-fuchsia-500 px-5 py-2 text-sm font-semibold text-white hover:bg-fuchsia-600 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
