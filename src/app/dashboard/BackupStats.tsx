"use client";

import { useEffect, useState } from "react";
import { Database, ShieldAlert } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function BackupStats() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/backup-stats");
        if (res.ok) {
          setStats(await res.json());
        } else {
          setError("Could not load stats.");
        }
      } catch {
        setError("Could not load stats.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-zinc-400">Loading stats…</p>;
  if (error || !stats) return <p className="text-sm text-zinc-400">{error || "No stats."}</p>;

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-lg font-bold text-zinc-900">{value}</p>
    </div>
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Database className="h-4 w-4 text-red-500" />
        Database &amp; Security Stats
      </h2>

      {stats.warnings?.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {stats.warnings.map((w: string) => (
            <p key={w}>⚠️ {w}</p>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Users" value={`${stats.users.total} (${stats.users.verified}✓)`} />
        <Stat label="Projects" value={stats.projects.total} />
        <Stat label="Events" value={`${stats.events.total} (${stats.events.upcoming} upcoming)`} />
        <Stat label="Messages" value={stats.messages.total} />
        <Stat label="Conversations" value={`${stats.conversations.total} (${stats.conversations.groups} groups)`} />
        <Stat label="Subscribers" value={stats.emailSubscribers.subscribed} />
        <Stat label="Bookmarks" value={stats.bookmarks.total} />
        <Stat label="Join requests (pending)" value={stats.joinRequests.pending} />
        <Stat label="New signups (24h)" value={stats.activity.newSignups24h} />
        <Stat label="Unverified >7d" value={stats.activity.unverifiedAccountsOlderThan7d} />
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
          <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Security (last 24h)
        </p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600 sm:grid-cols-3">
          <span>Failed logins: <strong>{stats.security.failedLoginAttempts24h}</strong></span>
          <span>IDOR attempts: <strong>{stats.security.idorAttempts24h}</strong></span>
          <span>Admin denied: <strong>{stats.security.adminUnauthorized24h}</strong></span>
          <span>Rate-limit hits: <strong>{stats.security.rateLimitHits24h}</strong></span>
          <span>Pending reports: <strong>{stats.security.pendingReports}</strong></span>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-400">Blob storage: {stats.blobStorage.note}</p>
    </div>
  );
}
