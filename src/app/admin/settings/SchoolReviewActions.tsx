"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SchoolReviewActions({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(kind: "verify" | "reject") {
    if (busy) return;
    if (kind === "reject" && !confirm("Reject and delete this school registration?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}/${kind}`, { method: "PUT" });
      if (res.ok) router.refresh();
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={() => run("verify")}
        disabled={busy}
        className="rounded-lg bg-[#1e40af] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
      >
        Verify
      </button>
      <button
        onClick={() => run("reject")}
        disabled={busy}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
