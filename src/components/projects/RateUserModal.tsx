"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RateUserModalProps {
  toUserId: string;
  toUserName: string;
  projectId: string;
  projectName: string;
  onClose: () => void;
  onDone: () => void;
}

export default function RateUserModal({
  toUserId,
  toUserName,
  projectId,
  projectName: _projectName,
  onClose,
  onDone,
}: RateUserModalProps) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (stars === 0) return;
    setLoading(true);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId, projectId, stars, comment }),
    });
    if (res.ok) setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center">
          <Star className="mx-auto h-10 w-10 fill-amber-400 text-amber-400" />
          <h3 className="mt-3 text-lg font-semibold text-zinc-900">Rating submitted!</h3>
          <p className="mt-1 text-sm text-zinc-500">You rated {toUserName}</p>
          <button
            onClick={() => { onClose(); onDone(); }}
            className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6">
        <h3 className="text-lg font-semibold text-zinc-900">
          Rate {toUserName}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          How was your experience working together?
        </p>

        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setStars(star)}
              className="transition-all hover:scale-110"
            >
              <Star
                className={cn(
                  "h-8 w-8",
                  star <= stars
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-zinc-300"
                )}
              />
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-zinc-700">
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="What was it like working with them?"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={stars === 0 || loading}
            className="flex-1 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
