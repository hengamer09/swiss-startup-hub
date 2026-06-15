"use client";

import { computeProjectCompleteness, type ProjectCompletenessInput } from "@/lib/projectCompleteness";
import { cn } from "@/lib/utils";

// Full quality breakdown with suggestions (owner detail page + edit page).
export default function ProjectQualityCard({ project }: { project: ProjectCompletenessInput }) {
  const { percent, items, badge } = computeProjectCompleteness(project);

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#0f172a]">Project Quality</h2>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", badge.className)}>{badge.label}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
          <div className="h-2 rounded-full bg-[#1e40af] transition-all" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-sm font-bold text-[#0f172a]">{percent}%</span>
      </div>
      <ul className="mt-3 space-y-1">
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-2 text-xs">
            <span className={it.done ? "text-green-600" : "text-[#94a3b8]"}>{it.done ? "✓" : "○"}</span>
            <span className={it.done ? "text-[#475569]" : "text-[#0f172a]"}>
              {it.done ? it.label : it.suggestion}
            </span>
            <span className="ml-auto text-[#94a3b8]">{it.weight}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
