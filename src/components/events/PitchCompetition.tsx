"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { X } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const MEDALS = ["🥇", "🥈", "🥉"];

export default function PitchCompetition({
  eventId,
  isOrganizer,
  loggedIn,
  participatingSchoolIds,
  prizeDescription,
}: {
  eventId: string;
  isOrganizer: boolean;
  loggedIn: boolean;
  participatingSchoolIds: string[];
  prizeDescription: string | null;
}) {
  const [teams, setTeams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [votingClosed, setVotingClosed] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [voteTarget, setVoteTarget] = useState<any>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [toast, setToast] = useState("");

  const loadVotes = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/votes`);
    if (res.ok) {
      const d = await res.json();
      setResults(d.results || []);
      setVotingClosed(d.votingClosed);
      setMyVote(d.myVote ?? null);
    }
  }, [eventId]);

  const loadTeams = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/teams`);
    if (res.ok) setTeams((await res.json()).teams || []);
  }, [eventId]);

  useEffect(() => { loadTeams(); loadVotes(); }, [loadTeams, loadVotes]);

  // Poll votes every 5s while voting is open.
  useEffect(() => {
    if (votingClosed) return;
    const t = setInterval(loadVotes, 5000);
    return () => clearInterval(t);
  }, [votingClosed, loadVotes]);

  useEffect(() => {
    if (participatingSchoolIds.length === 0) return;
    fetch("/api/schools").then((r) => (r.ok ? r.json() : { schools: [] })).then((d) => {
      setSchools((d.schools || []).filter((s: any) => participatingSchoolIds.includes(s.id)));
    });
  }, [participatingSchoolIds]);

  const votesByProject: Record<string, number> = {};
  for (const r of results) votesByProject[r.projectId] = r.votes;

  // Leaderboard: registered teams ranked by votes.
  const ranked = [...teams]
    .map((t) => ({ ...t, votes: votesByProject[t.projectId] || 0 }))
    .sort((a, b) => b.votes - a.votes);

  async function castVote(projectId: string) {
    setVoteTarget(null);
    const res = await fetch(`/api/events/${eventId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (res.ok) {
      setMyVote(projectId);
      setToast("Vote submitted! Live results update every 5 seconds.");
      setTimeout(() => setToast(""), 4000);
      loadVotes();
    }
  }

  async function closeVoting() {
    if (!confirm("Close voting and lock the leaderboard?")) return;
    const res = await fetch(`/api/events/${eventId}/close-voting`, { method: "PUT" });
    if (res.ok) { setVotingClosed(true); loadVotes(); }
  }

  async function openRegister() {
    const res = await fetch("/api/users/me/projects");
    if (res.ok) setMyProjects((await res.json()).projects || []);
    setRegisterOpen(true);
  }

  async function registerTeam(projectId: string) {
    const res = await fetch(`/api/events/${eventId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (res.ok) { setRegisterOpen(false); loadTeams(); }
  }

  const winner = votingClosed && ranked.length > 0 && ranked[0].votes > 0 ? ranked[0].project?.name : null;

  return (
    <div className="mt-6 space-y-5 border-t border-zinc-100 pt-6">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
        <div className="flex items-center gap-2 text-sm">
          {votingClosed ? (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700">Voting closed{winner ? ` — Winner: ${winner}` : ""}</span>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="font-medium text-green-700">Live results</span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {loggedIn && <button onClick={openRegister} className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#f8fafc]">Register your team</button>}
          {isOrganizer && !votingClosed && (
            <button onClick={closeVoting} className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Close Voting</button>
          )}
        </div>
      </div>

      {prizeDescription && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">🏆 {prizeDescription}</div>
      )}

      {schools.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[#0f172a]">🏫 Participating Schools</h3>
          <div className="flex flex-wrap gap-2">
            {schools.map((s) => (
              <Link key={s.id} href={`/schools/${s.id}`} className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#f8fafc]">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[#0f172a]">🎤 Registered Teams</h3>
        {ranked.length === 0 ? (
          <p className="text-sm text-[#94a3b8]">No teams registered yet.</p>
        ) : (
          <div className="divide-y divide-[#e2e8f0] rounded-xl border border-[#e2e8f0] bg-white">
            {ranked.map((t, i) => {
              const voted = myVote === t.projectId;
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-6 text-center text-sm">{i < 3 ? MEDALS[i] : `${i + 1}.`}</span>
                    <div className="min-w-0">
                      <Link href={`/projects/${t.projectId}`} className="truncate text-sm font-medium text-[#0f172a] hover:text-[#1e40af]">{t.project?.name}</Link>
                      <p className="text-xs text-[#94a3b8]">{t.project?.school?.name || t.project?.owner?.name || ""}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-[#1e40af]">{t.votes} vote{t.votes === 1 ? "" : "s"}</span>
                    {!votingClosed && loggedIn && (
                      voted ? (
                        <span className="rounded-lg bg-green-50 px-3 py-1 text-xs font-medium text-green-700">You voted ✓</span>
                      ) : (
                        <button onClick={() => setVoteTarget(t)} className="rounded-lg bg-[#1e40af] px-3 py-1 text-xs font-medium text-white hover:bg-[#1d4ed8]">
                          Vote
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vote confirm modal */}
      {voteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center">
            <h3 className="text-lg font-semibold text-[#0f172a]">You&apos;re voting for {voteTarget.project?.name}</h3>
            <p className="mt-2 text-sm text-[#475569]">This is your only vote. Make it count!</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setVoteTarget(null)} className="flex-1 rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]">Cancel</button>
              <button onClick={() => castVote(voteTarget.projectId)} className="flex-1 rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Register team modal */}
      {registerOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#0f172a]">Register your team</h3>
              <button onClick={() => setRegisterOpen(false)} aria-label="Close" className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100"><X className="h-5 w-5" /></button>
            </div>
            {myProjects.length === 0 ? (
              <p className="mt-3 text-sm text-[#94a3b8]">You don&apos;t have a project to register. Create one first.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {myProjects.map((p) => (
                  <button key={p.id} onClick={() => registerTeam(p.id)} className="block w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-left text-sm font-medium text-[#0f172a] hover:bg-[#f8fafc]">
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-[80] rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-lg">{toast}</div>
      )}
    </div>
  );
}
