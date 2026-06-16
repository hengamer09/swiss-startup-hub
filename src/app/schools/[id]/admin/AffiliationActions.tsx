"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AffiliationActions({ schoolId, projectId }: { schoolId: string; projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "reject") {
    if (busy) return;
    if (action === "reject" && !confirm("Reject this project's school affiliation?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/affiliations/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={() => act("approve")}
        disabled={busy}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => act("reject")}
        disabled={busy}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
