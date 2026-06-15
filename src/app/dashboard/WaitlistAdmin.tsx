"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ROLE_BADGE: Record<string, string> = {
  FOUNDER: "bg-blue-50 text-blue-700",
  PROFESSIONAL: "bg-blue-50 text-blue-700",
  INVESTOR: "bg-amber-50 text-amber-700",
};
const ROLE_LABEL: Record<string, string> = {
  FOUNDER: "Founder",
  PROFESSIONAL: "Professional",
  INVESTOR: "Investor",
};

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function WaitlistAdmin() {
  const [entries, setEntries] = useState<any[]>([]);
  const [byRole, setByRole] = useState<Record<string, number>>({ FOUNDER: 0, PROFESSIONAL: 0, INVESTOR: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [visible, setVisible] = useState(50);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/waitlist");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setByRole(data.byRole || {});
        setTotal(data.total || 0);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (roleFilter && e.role !== roleFilter) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, search, roleFilter]);

  async function remove(id: string) {
    if (!confirm("Delete this waitlist entry?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/waitlist/${id}`, { method: "DELETE" });
    if (res.ok) {
      const removed = entries.find((e) => e.id === id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      if (removed) setByRole((r) => ({ ...r, [removed.role]: Math.max(0, (r[removed.role] || 0) - 1) }));
    }
    setDeleting(null);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">📋 Waitlist</h2>
        <a
          href="/api/admin/waitlist/export"
          className="inline-flex items-center gap-1.5 rounded-md bg-[#1e40af] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8] transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download CSV ({total} {total === 1 ? "entry" : "entries"})
        </a>
      </div>

      {/* Stat cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-400">Total</p>
          <p className="text-lg font-bold text-zinc-900">{total}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-400">Founders</p>
          <p className="text-lg font-bold text-zinc-900">{byRole.FOUNDER || 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-400">Professionals</p>
          <p className="text-lg font-bold text-zinc-900">{byRole.PROFESSIONAL || 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-400">Investors</p>
          <p className="text-lg font-bold text-zinc-900">{byRole.INVESTOR || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-md border border-zinc-300 py-2 pl-9 pr-3 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
        >
          <option value="">All roles</option>
          <option value="FOUNDER">Founders</option>
          <option value="PROFESSIONAL">Professionals</option>
          <option value="INVESTOR">Investors</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-6 text-center text-sm text-zinc-500">
            No waitlist entries{search || roleFilter ? " match your filters" : " yet"}.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="py-2 pr-3 font-medium">Message</th>
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visible).map((e) => (
                <tr key={e.id} className="border-b border-zinc-100">
                  <td className="py-2 pr-3 font-medium text-zinc-800">{e.name}</td>
                  <td className="py-2 pr-3 text-zinc-600">{e.email}</td>
                  <td className="py-2 pr-3">
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium", ROLE_BADGE[e.role] || "bg-zinc-100 text-zinc-600")}>
                      {ROLE_LABEL[e.role] || e.role}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-zinc-500" title={e.message || ""}>
                    {e.message ? (e.message.length > 50 ? e.message.slice(0, 50) + "…" : e.message) : "—"}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap text-zinc-400">{relativeTime(e.createdAt)}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => remove(e.id)}
                      disabled={deleting === e.id}
                      aria-label={`Delete ${e.name}`}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > visible && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setVisible((v) => v + 50)}
            className="rounded-full border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
