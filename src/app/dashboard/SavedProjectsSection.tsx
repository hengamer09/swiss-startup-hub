"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, X } from "lucide-react";
import { formatStage } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function SavedProjectsSection() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/bookmarks");
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks || []);
      }
      setLoading(false);
    })();
  }, []);

  async function remove(projectId: string) {
    setBookmarks((prev) => prev.filter((b) => b.project.id !== projectId));
    await fetch(`/api/bookmarks/${projectId}`, { method: "DELETE" });
  }

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
        <Bookmark className="h-4 w-4 text-zinc-400" />
        Saved Projects
      </h2>
      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : bookmarks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-6 text-center text-sm text-zinc-500">
          No saved projects yet. Browse the feed to find projects!
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4"
            >
              <Link href={`/projects/${b.project.id}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-900">{b.project.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {b.project.industry || "—"} &middot;{" "}
                  <span className="font-medium text-[#1e40af]">{formatStage(b.project.stage)}</span>
                </p>
              </Link>
              <button
                onClick={() => remove(b.project.id)}
                aria-label="Remove bookmark"
                className="shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-[#1e40af] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
