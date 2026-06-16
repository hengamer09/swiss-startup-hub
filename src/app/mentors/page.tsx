"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const STYLES = ["One-time advice", "Weekly check-ins", "Project-based"];

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (style) params.set("style", style);
    if (location) params.set("location", location);
    fetch(`/api/mentors?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { mentors: [] }))
      .then((d) => setMentors(d.mentors || []))
      .finally(() => setLoading(false));
  }, [style, location]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-[#0f172a]">🎯 Find a Mentor</h1>
      <p className="mt-1 text-sm text-[#475569]">
        Connect with experienced professionals who want to help your startup grow.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none"
        >
          <option value="">All mentoring styles</option>
          {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Filter by location…"
          className="rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-[#94a3b8]">Loading mentors…</p>
      ) : mentors.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#e2e8f0] bg-white py-16 text-center">
          <Target className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="text-sm text-[#475569]">No mentors available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <div key={m.id} className="rounded-xl border border-[#e2e8f0] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-purple-50 text-base font-bold text-purple-700">
                  {m.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    m.name?.charAt(0) || "M"
                  )}
                </div>
                <div className="min-w-0">
                  <Link href={`/profile/${m.id}`} className="truncate font-semibold text-[#0f172a] hover:text-[#1e40af]">
                    {m.name}
                  </Link>
                  {m.mentoringStyle && (
                    <span className="block rounded-full text-xs font-medium text-purple-700">{m.mentoringStyle}</span>
                  )}
                </div>
              </div>
              {m.mentorBio && <p className="mt-3 line-clamp-3 text-sm text-[#475569]">{m.mentorBio}</p>}
              {m.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {m.skills.map((s: any) => (
                    <span key={s.skill.id} className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-medium text-[#475569]">
                      {s.skill.name}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={`/profile/${m.id}`}
                className="mt-4 block w-full rounded-lg bg-[#1e40af] px-4 py-2 text-center text-xs font-medium text-white hover:bg-[#1d4ed8] transition-colors"
              >
                View Profile &amp; Connect
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
