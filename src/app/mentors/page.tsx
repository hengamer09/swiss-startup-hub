"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Target, X } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const STYLES = ["One-time advice", "Weekly check-ins", "Project-based"];

export default function MentorsPage() {
  const { data: session } = useSession();
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState("");
  const [location, setLocation] = useState("");
  const [requestMentor, setRequestMentor] = useState<any>(null);
  const [toast, setToast] = useState("");

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
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/profile/${m.id}`}
                  className="flex-1 rounded-lg border border-[#e2e8f0] px-3 py-2 text-center text-xs font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
                >
                  View Profile
                </Link>
                {session && session.user?.id !== m.id && (
                  <button
                    onClick={() => setRequestMentor(m)}
                    className="flex-1 rounded-lg bg-[#1e40af] px-3 py-2 text-center text-xs font-medium text-white hover:bg-[#1d4ed8] transition-colors"
                  >
                    Request Mentorship
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {requestMentor && (
        <RequestModal
          mentor={requestMentor}
          onClose={() => setRequestMentor(null)}
          onDone={() => { setRequestMentor(null); setToast("Mentorship request sent!"); setTimeout(() => setToast(""), 4000); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-[80] rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function RequestModal({ mentor, onClose, onDone }: { mentor: any; onClose: () => void; onDone: () => void }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState("");
  const [helpText, setHelpText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users/me/projects")
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => setProjects(d.projects || []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!projectId) return setError("Please select a project.");
    if (!helpText.trim()) return setError("Please describe what you need help with.");
    setBusy(true);
    try {
      const res = await fetch(`/api/mentors/${mentor.id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, helpText: helpText.trim() }),
      });
      const data = await res.json();
      if (res.ok) onDone();
      else setError(data.error || "Could not send request.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 block w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#0f172a]">Request mentorship from {mentor.name}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-[#0f172a]">What project do you need help with?</label>
            {projects.length === 0 ? (
              <p className="mt-1 text-xs text-[#94a3b8]">You don&apos;t have any projects yet. Create one first.</p>
            ) : (
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={input} required>
                <option value="">Select a project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0f172a]">What do you need help with?</label>
            <textarea value={helpText} onChange={(e) => setHelpText(e.target.value)} rows={4} maxLength={500} required className={input} placeholder="Describe what you're looking for help with…" />
          </div>
          <button type="submit" disabled={busy || projects.length === 0} className="w-full rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
            {busy ? "Sending…" : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
