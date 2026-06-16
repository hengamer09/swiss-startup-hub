"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { formatSchoolType } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function SchoolAdmin() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/schools");
    if (res.ok) {
      const data = await res.json();
      setSchools(data.schools || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "verify" | "reject") {
    if (action === "reject" && !confirm("Reject and delete this school registration?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/schools/${id}/${action}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        if (action === "verify") {
          setSchools((prev) => prev.map((s) => (s.id === id ? { ...s, verified: true } : s)));
        } else {
          setSchools((prev) => prev.filter((s) => s.id !== id));
        }
      }
    } finally {
      setBusy(null);
    }
  }

  const pending = schools.filter((s) => !s.verified);
  const verified = schools.filter((s) => s.verified);

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
        <GraduationCap className="h-4 w-4 text-purple-600" /> School Management
      </h2>

      {loading ? (
        <p className="mt-3 text-sm text-[#94a3b8]">Loading…</p>
      ) : (
        <>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
            Pending ({pending.length})
          </h3>
          {pending.length === 0 ? (
            <p className="mt-1 text-sm text-[#94a3b8]">No pending registrations.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {pending.map((s) => (
                <div key={s.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-[#0f172a]">{s.name}</p>
                  <p className="text-xs text-[#475569]">
                    {formatSchoolType(s.type)} · {s.city}, {s.canton} · {s.contactName} ({s.contactEmail})
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => act(s.id, "verify")}
                      disabled={busy === s.id}
                      className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => act(s.id, "reject")}
                      disabled={busy === s.id}
                      className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
            Verified ({verified.length})
          </h3>
          <div className="mt-2 divide-y divide-[#e2e8f0]">
            {verified.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#0f172a]">{s.name}</p>
                  <p className="text-xs text-[#94a3b8]">
                    {formatSchoolType(s.type)} · {s.canton} · {s._count?.students ?? 0} students · {s._count?.projects ?? 0} projects
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Verified</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
