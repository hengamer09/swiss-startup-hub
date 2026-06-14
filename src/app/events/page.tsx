"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

type EventItem = any;

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [scope, setScope] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchEvents = async (append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (scope) params.set("scope", scope);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (append && nextCursor) params.set("cursor", nextCursor);

    const res = await fetch(`/api/events?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (append) {
        setEvents(prev => [...prev, ...(data.events || [])]);
      } else {
        setEvents(data.events || []);
      }
      setNextCursor(data.nextCursor ?? null);
    }
    if (!append) setLoading(false);
    else setLoadingMore(false);
  };

  useEffect(() => {
    setNextCursor(null);
    fetchEvents(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, scope, startDate, endDate]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Events</h1>
          <p className="text-sm text-zinc-500">Discover upcoming community events</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/events/new" className="rounded-md bg-[#1e40af] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors">
            Create Event
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
          <option value="">All types</option>
          <option>Pitch Night</option>
          <option>Workshop</option>
          <option>Networking</option>
          <option>Hackathon</option>
          <option>Other</option>
        </select>
        <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
          <option value="">Any scope</option>
          <option>Local</option>
          <option>National</option>
          <option>International</option>
          <option>Online</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">Loading...</div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <h2 className="text-lg font-medium text-zinc-700">No events found</h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">Try adjusting filters or create a new event.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev: any) => (
              <Link key={ev.id} href={`/events/${ev.id}`} className="block rounded-xl border border-zinc-200 bg-white p-4 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-zinc-900 truncate">{ev.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{ev.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5">{ev.eventType}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-medium text-zinc-900">{new Date(ev.date).toLocaleString()}</div>
                    <div className="mt-2 text-xs text-zinc-500">{ev._count?.attendees || 0} attending</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {nextCursor && !loading && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => fetchEvents(true)}
                disabled={loadingMore}
                className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
