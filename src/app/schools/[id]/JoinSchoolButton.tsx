"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinSchoolButton({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function join() {
    setBusy(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/join`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={join}
      disabled={busy}
      className="rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors"
    >
      {busy ? "Joining…" : "Join this School"}
    </button>
  );
}
