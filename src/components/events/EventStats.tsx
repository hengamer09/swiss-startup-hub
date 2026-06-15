"use client";

import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function EventStats({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/events/${eventId}/stats`);
      if (res.ok) setStats(await res.json());
      setLoading(false);
    })();
  }, [eventId]);

  if (loading) return null;
  if (!stats) return null;

  const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
      <p className="text-xs text-[#94a3b8]">{label}</p>
      <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
    </div>
  );

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[#0f172a]">Event Stats</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Registrations" value={stats.totalRegistrations} />
        <Stat label="Approved" value={stats.approved} />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Declined" value={stats.declined} />
        <Stat label="Messages" value={stats.messageCount} />
      </div>
    </section>
  );
}
