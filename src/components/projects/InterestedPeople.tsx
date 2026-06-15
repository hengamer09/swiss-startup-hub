"use client";

import { useState } from "react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function InterestedPeople({
  projectId,
  interests,
}: {
  projectId: string;
  interests: any[];
}) {
  const [invited, setInvited] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (!interests || interests.length === 0) return null;

  async function invite(userId: string) {
    if (busy) return;
    setBusy(userId);
    try {
      const res = await fetch(`/api/projects/${projectId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) setInvited((prev) => ({ ...prev, [userId]: true }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 border-t border-zinc-100 pt-6">
      <h2 className="mb-3 text-sm font-semibold text-[#0f172a]">
        Interested People <span className="font-normal text-[#94a3b8]">({interests.length})</span>
      </h2>
      <div className="space-y-2">
        {interests.map((it) => {
          const u = it.user;
          const skills = (u?.skills || []).map((s: any) => s.skill?.name).filter(Boolean).slice(0, 3);
          return (
            <div key={it.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#f8fafc] px-3 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#1e40af]">
                  {u?.name?.charAt(0) || "U"}
                </div>
                <div className="min-w-0">
                  <Link href={`/profile/${u?.id}`} className="text-sm font-medium text-[#0f172a] hover:text-[#1e40af]">
                    {u?.name || "Someone"}
                  </Link>
                  {skills.length > 0 && (
                    <p className="truncate text-xs text-[#94a3b8]">{skills.join(" · ")}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/profile/${u?.id}`}
                  className="rounded-lg border border-[#e2e8f0] px-3 py-1 text-xs font-medium text-[#475569] hover:bg-white"
                >
                  View Profile
                </Link>
                <button
                  type="button"
                  onClick={() => invite(u?.id)}
                  disabled={invited[u?.id] || busy === u?.id}
                  className="rounded-lg bg-[#1e40af] px-3 py-1 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                >
                  {invited[u?.id] ? "Invited ✓" : "Invite to Apply"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
