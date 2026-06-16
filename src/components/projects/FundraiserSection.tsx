"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, X, Copy, Check } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

type RewardDraft = { amount: string; title: string; description: string; limit: string };

function daysLeft(deadline: string): number {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function FundraiserSection({
  projectId,
  isOwner,
  isStudentProject,
  currentUser,
}: {
  projectId: string;
  isOwner: boolean;
  isStudentProject: boolean;
  currentUser: { name: string | null; email: string | null } | null;
}) {
  const [fundraiser, setFundraiser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/fundraiser`);
    if (res.ok) setFundraiser((await res.json()).fundraiser);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;
  if (!fundraiser && !(isOwner && isStudentProject)) return null;

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-[#0f172a]">💰 Fundraising</h2>
      {fundraiser ? (
        <ActiveFundraiser
          projectId={projectId}
          fundraiser={fundraiser}
          isOwner={isOwner}
          currentUser={currentUser}
          onChange={load}
        />
      ) : (
        <CreateFundraiser projectId={projectId} onCreated={setFundraiser} />
      )}
    </section>
  );
}

function CreateFundraiser({ projectId, onCreated }: { projectId: string; onCreated: (f: any) => void }) {
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [rewards, setRewards] = useState<RewardDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function addReward() {
    setRewards((r) => [...r, { amount: "", title: "", description: "", limit: "" }]);
  }
  function setReward(i: number, key: keyof RewardDraft, val: string) {
    setRewards((r) => r.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/fundraiser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: Number(goal),
          description,
          deadline: new Date(deadline).toISOString(),
          rewards: rewards
            .filter((r) => r.amount && r.title && r.description)
            .map((r) => ({ amount: Number(r.amount), title: r.title, description: r.description, limit: r.limit ? Number(r.limit) : null })),
        }),
      });
      const data = await res.json();
      if (res.ok) onCreated(data);
      else setError(data.error || "Could not start fundraiser.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 block w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-[#94a3b8]">Raise small amounts to kickstart your student project (CHF 100–10,000).</p>
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[#0f172a]">Goal (CHF)</label>
          <input type="number" min={100} max={10000} required value={goal} onChange={(e) => setGoal(e.target.value)} className={input} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#0f172a]">Deadline</label>
          <input type="date" required value={deadline} onChange={(e) => setDeadline(e.target.value)} className={input} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#0f172a]">What do you need the money for?</label>
        <textarea required maxLength={1000} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
      </div>

      <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#0f172a]">🎁 Reward tiers (optional)</span>
          <button type="button" onClick={addReward} className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-medium text-[#475569] hover:bg-white">
            <Plus className="h-3 w-3" /> Add Reward
          </button>
        </div>
        {rewards.map((r, i) => (
          <div key={i} className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-[#e2e8f0] bg-white p-2 sm:grid-cols-4">
            <input type="number" min={1} placeholder="CHF" value={r.amount} onChange={(e) => setReward(i, "amount", e.target.value)} className="rounded border border-[#e2e8f0] px-2 py-1 text-xs" />
            <input type="text" maxLength={50} placeholder="Title" value={r.title} onChange={(e) => setReward(i, "title", e.target.value)} className="rounded border border-[#e2e8f0] px-2 py-1 text-xs" />
            <input type="text" maxLength={200} placeholder="What they get" value={r.description} onChange={(e) => setReward(i, "description", e.target.value)} className="col-span-2 rounded border border-[#e2e8f0] px-2 py-1 text-xs sm:col-span-1" />
            <input type="number" min={1} placeholder="Limit (opt)" value={r.limit} onChange={(e) => setReward(i, "limit", e.target.value)} className="rounded border border-[#e2e8f0] px-2 py-1 text-xs" />
          </div>
        ))}
      </div>

      <button type="submit" disabled={busy} className="rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
        {busy ? "Starting…" : "Start Fundraiser"}
      </button>
    </form>
  );
}

function ActiveFundraiser({ projectId, fundraiser, isOwner, currentUser, onChange }: {
  projectId: string; fundraiser: any; isOwner: boolean;
  currentUser: { name: string | null; email: string | null } | null; onChange: () => void;
}) {
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const pct = Math.min(100, Math.round((fundraiser.currentAmount / fundraiser.goal) * 100));
  const supporters = fundraiser.pledges || [];

  return (
    <div>
      <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-green-700">{pct}% funded</span>
          {fundraiser.isActive
            ? <span className="text-[#94a3b8]">{daysLeft(fundraiser.deadline)} days left</span>
            : <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-[#475569]">Closed</span>}
        </div>
        <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-4 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm text-[#0f172a]">
          <strong>CHF {fundraiser.currentAmount}</strong> of CHF {fundraiser.goal} raised · {supporters.length} supporter{supporters.length === 1 ? "" : "s"}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-[#475569]">{fundraiser.description}</p>
        {fundraiser.isActive && (
          <button onClick={() => { setSelectedReward(null); setPledgeOpen(true); }} className="mt-3 rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">
            Support this Project
          </button>
        )}
      </div>

      {fundraiser.rewards?.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-[#0f172a]">🎁 Support &amp; Get</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fundraiser.rewards.map((r: any) => {
              const soldOut = r.limit !== null && r.claimed >= r.limit;
              return (
                <div key={r.id} className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#1e40af]">CHF {r.amount}</span>
                    {r.limit !== null && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${soldOut ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                        {soldOut ? "Sold out" : `${r.limit - r.claimed} remaining`}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-semibold text-[#0f172a]">{r.title}</p>
                  <p className="mt-0.5 text-sm text-[#475569]">{r.description}</p>
                  {fundraiser.isActive && !soldOut && (
                    <button onClick={() => { setSelectedReward(r); setPledgeOpen(true); }} className="mt-3 w-full rounded-lg border border-[#1e40af] px-4 py-1.5 text-xs font-medium text-[#1e40af] hover:bg-blue-50">
                      Support at this level
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {supporters.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-[#0f172a]">Supporters</h3>
          <div className="space-y-1">
            {supporters.slice(0, 20).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-[#f8fafc] px-3 py-1.5 text-sm">
                <span className="text-[#0f172a]">{p.name}{p.message ? <span className="text-[#94a3b8]"> — “{p.message}”</span> : null}</span>
                <span className="font-medium text-green-700">CHF {p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOwner && <VoucherManager projectId={projectId} fundraiser={fundraiser} onChange={onChange} />}

      {pledgeOpen && (
        <PledgeModal
          projectId={projectId}
          rewards={fundraiser.rewards || []}
          preselected={selectedReward}
          currentUser={currentUser}
          onClose={() => setPledgeOpen(false)}
          onDone={onChange}
        />
      )}
    </div>
  );
}

function PledgeModal({ projectId, rewards, preselected, currentUser, onClose, onDone }: {
  projectId: string; rewards: any[]; preselected: any;
  currentUser: { name: string | null; email: string | null } | null;
  onClose: () => void; onDone: () => void;
}) {
  const [reward, setReward] = useState<any>(preselected);
  const [amount, setAmount] = useState<string>(preselected ? String(preselected.amount) : "");
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voucher, setVoucher] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/fundraiser/pledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, amount: reward ? reward.amount : Number(amount), rewardId: reward?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not pledge."); return; }
      onDone();
      if (data.voucherCode) setVoucher(data.voucherCode);
      else onClose();
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 block w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#0f172a]">Support this project</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100"><X className="h-5 w-5" /></button>
        </div>

        {voucher ? (
          <div className="mt-4 text-center">
            <p className="text-sm text-[#475569]">🎉 Your voucher code:</p>
            <div className="mt-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 font-mono text-sm text-[#0f172a]">{voucher}</div>
            <button
              onClick={() => { navigator.clipboard.writeText(voucher); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-4 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc]"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied!" : "Copy"}
            </button>
            <p className="mt-3 text-xs text-[#94a3b8]">This is a one-time use code. Share it with the startup to redeem your reward. The team will contact you about payment.</p>
            <button onClick={onClose} className="mt-4 w-full rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            {rewards.length > 0 && (
              <div className="space-y-1">
                {rewards.map((r) => {
                  const soldOut = r.limit !== null && r.claimed >= r.limit;
                  const active = reward?.id === r.id;
                  return (
                    <button key={r.id} type="button" disabled={soldOut}
                      onClick={() => { setReward(r); setAmount(String(r.amount)); }}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${soldOut ? "cursor-not-allowed opacity-50" : active ? "border-[#1e40af] bg-blue-50" : "border-[#e2e8f0] hover:bg-[#f8fafc]"}`}>
                      <span><strong className="text-[#1e40af]">CHF {r.amount}</strong> · {r.title}</span>
                      {soldOut && <span className="text-xs text-red-700">Sold out</span>}
                    </button>
                  );
                })}
                <button type="button" onClick={() => { setReward(null); setAmount(""); }} className="text-xs text-[#94a3b8] hover:text-[#475569]">No reward — custom amount</button>
              </div>
            )}
            {!reward && (
              <div>
                <label className="block text-xs font-medium text-[#0f172a]">Amount (CHF)</label>
                <input type="number" min={1} max={1000} required value={amount} onChange={(e) => setAmount(e.target.value)} className={input} />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[#0f172a]">Your name</label>
              <input type="text" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0f172a]">Your email</label>
              <input type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0f172a]">Message <span className="font-normal text-[#94a3b8]">(optional)</span></label>
              <input type="text" maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} className={input} />
            </div>
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
              {busy ? "Submitting…" : "Pledge Support"}
            </button>
            <p className="text-center text-xs text-[#94a3b8]">No payment is processed here. You will arrange payment directly with the team.</p>
          </form>
        )}
      </div>
    </div>
  );
}

function VoucherManager({ projectId, fundraiser, onChange }: { projectId: string; fundraiser: any; onChange: () => void }) {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [tab, setTab] = useState<"pending" | "redeemed">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const loadVouchers = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/fundraiser/vouchers`);
    if (res.ok) setVouchers((await res.json()).vouchers || []);
  }, [projectId]);

  useEffect(() => { loadVouchers(); }, [loadVouchers]);

  async function redeem(vid: string) {
    const usedBy = prompt("Who redeemed this voucher? (optional name/email)") ?? "";
    setBusy(vid);
    try {
      const res = await fetch(`/api/projects/${projectId}/fundraiser/vouchers/${vid}/redeem`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usedBy }),
      });
      if (res.ok) await loadVouchers();
    } finally {
      setBusy(null);
    }
  }

  async function closeFundraiser() {
    if (!confirm("Close this fundraiser? No more pledges can be made.")) return;
    const res = await fetch(`/api/projects/${projectId}/fundraiser/close`, { method: "PUT" });
    if (res.ok) onChange();
  }

  const pending = vouchers.filter((v) => !v.usedAt);
  const redeemed = vouchers.filter((v) => v.usedAt);
  const shown = tab === "pending" ? pending : redeemed;

  return (
    <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#0f172a]">🎟️ Vouchers</h3>
        {fundraiser.isActive && (
          <button onClick={closeFundraiser} className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
            Close fundraiser
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-[#94a3b8]">{vouchers.length} issued · {redeemed.length} redeemed · {pending.length} pending</p>

      <div className="mt-2 inline-flex rounded-lg border border-[#e2e8f0] bg-white p-1 text-xs">
        <button onClick={() => setTab("pending")} className={`rounded px-3 py-1 font-medium ${tab === "pending" ? "bg-[#1e40af] text-white" : "text-[#475569]"}`}>Pending ({pending.length})</button>
        <button onClick={() => setTab("redeemed")} className={`rounded px-3 py-1 font-medium ${tab === "redeemed" ? "bg-[#1e40af] text-white" : "text-[#475569]"}`}>Redeemed ({redeemed.length})</button>
      </div>

      <div className="mt-2 space-y-1">
        {shown.length === 0 ? (
          <p className="text-xs text-[#94a3b8]">No {tab} vouchers.</p>
        ) : shown.map((v) => (
          <div key={v.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${v.usedAt ? "bg-zinc-100" : "bg-white"}`}>
            <div className="min-w-0">
              <span className="font-mono text-[#0f172a]">{v.code}</span>
              <span className="text-[#94a3b8]"> · {v.pledge?.name} · {v.reward?.title}</span>
              {v.usedAt && <span className="text-[#94a3b8]"> · redeemed{v.usedBy ? ` by ${v.usedBy}` : ""}</span>}
            </div>
            {!v.usedAt && (
              <button onClick={() => redeem(v.id)} disabled={busy === v.id} className="shrink-0 rounded-lg bg-[#1e40af] px-2 py-1 font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
                Mark redeemed
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
