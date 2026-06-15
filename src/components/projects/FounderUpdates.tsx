"use client";

import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function FounderUpdates({
  projectId,
  isOwner,
  initialUpdates,
  initialCursor,
}: {
  projectId: string;
  isOwner: boolean;
  initialUpdates: any[];
  initialCursor: string | null;
}) {
  const [updates, setUpdates] = useState<any[]>(initialUpdates || []);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [progress, setProgress] = useState("");
  const [challenge, setChallenge] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (posting || !progress.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: progress.trim(), challenge: challenge.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpdates((prev) => [data, ...prev]);
        setProgress("");
        setChallenge("");
      } else {
        setError(data.error || "Could not post update.");
      }
    } catch {
      setError("Could not post update.");
    } finally {
      setPosting(false);
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const res = await fetch(`/api/projects/${projectId}/updates?cursor=${cursor}`);
    if (res.ok) {
      const data = await res.json();
      setUpdates((prev) => [...prev, ...(data.updates || [])]);
      setCursor(data.nextCursor ?? null);
    }
    setLoadingMore(false);
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-4">
          <h2 className="text-sm font-semibold text-[#0f172a]">Post Weekly Update</h2>
          <p className="mt-0.5 text-xs text-[#94a3b8]">Keep your followers in the loop — it only takes 30 seconds.</p>
          <form onSubmit={post} className="mt-3 space-y-3">
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-[#0f172a]">Progress this week <span className="text-red-500">*</span></label>
              <textarea
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                rows={2}
                maxLength={500}
                required
                placeholder="What did you ship or achieve this week?"
                className="mt-1 block w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0f172a]">Current challenge <span className="font-normal text-[#94a3b8]">(optional)</span></label>
              <textarea
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="What are you stuck on or looking for help with?"
                className="mt-1 block w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={posting || !progress.trim()}
                className="rounded-lg bg-[#1e40af] px-4 py-2 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors"
              >
                {posting ? "Posting..." : "Post Update"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[#0f172a]">Updates</h2>
        {updates.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#e2e8f0] bg-white p-4 text-sm text-[#94a3b8]">
            No updates yet.{isOwner ? " Post your first one above." : ""}
          </p>
        ) : (
          <div className="space-y-3">
            {updates.map((u) => (
              <div key={u.id} className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                    {u.author?.name?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-medium text-[#0f172a]">{u.author?.name || "Founder"}</span>
                  <span className="text-xs text-[#94a3b8]">· {relativeTime(u.createdAt)}</span>
                </div>
                <p className="text-sm text-[#475569]"><span className="font-medium text-green-700">✅ Progress:</span> {u.progress}</p>
                {u.challenge && (
                  <p className="mt-1 text-sm text-[#475569]"><span className="font-medium text-amber-700">🚧 Challenge:</span> {u.challenge}</p>
                )}
              </div>
            ))}
            {cursor && (
              <div className="flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-[#e2e8f0] px-6 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
