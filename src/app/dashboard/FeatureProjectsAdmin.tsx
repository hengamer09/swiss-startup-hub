"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { formatStage } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function FeatureProjectsAdmin() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/feature-project");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
      setLoading(false);
    })();
  }, []);

  async function toggle(projectId: string, featured: boolean) {
    setBusy(projectId);
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, featured } : p)));
    try {
      const res = await fetch("/api/admin/feature-project", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, featured }),
      });
      if (!res.ok) setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, featured: !featured } : p)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
        <Star className="h-4 w-4 text-[#1e40af]" /> Feature Projects
      </h2>
      <p className="mt-0.5 text-xs text-[#94a3b8]">Featured projects appear at the top of the homepage and feed.</p>
      {loading ? (
        <p className="mt-3 text-sm text-[#94a3b8]">Loading…</p>
      ) : (
        <div className="mt-3 divide-y divide-[#e2e8f0]">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#0f172a]">
                  {p.featured && "⭐ "}{p.name}
                </p>
                <p className="text-xs text-[#94a3b8]">{p.industry || "—"} · {formatStage(p.stage)}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(p.id, !p.featured)}
                disabled={busy === p.id}
                className={`shrink-0 rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                  p.featured
                    ? "border-[#1e40af] bg-blue-50 text-[#1e40af]"
                    : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]"
                }`}
              >
                {p.featured ? "Featured ✓" : "Feature"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
