"use client";

import Link from "next/link";
import { useState } from "react";

export default function EventDetail({ event, userId }: { event: any; userId: string | null }) {
  const [statusMap, setStatusMap] = useState<Record<string,string>>({});

  const registered = event.attendees?.find((a: any) => a.userId === userId);
  const spotsRemaining = event.maxAttendees ? Math.max(0, event.maxAttendees - (event.attendees?.length || 0)) : null;

  const submitRegistration = async (regType: string, data: any) => {
    const res = await fetch(`/api/events/${event.id}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ regType, data }) });
    if (res.ok) {
      const d = await res.json();
      alert("Registration submitted: " + d.status);
      setStatusMap((s) => ({ ...s, [regType]: d.status }));
      location.reload();
    } else {
      const err = await res.json();
      alert(err.message || "Failed to register");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-zinc-900">{event.title}</h1>
        <p className="text-sm text-zinc-500">Hosted by <Link href="/profile">{event.organizer?.name}</Link></p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium">{event.eventType}</span>
              <span className="text-sm text-zinc-600">{new Date(event.date).toLocaleString()}</span>
              <span className="ml-2 text-sm text-zinc-600">{event.location}</span>
            </div>
            <p className="mt-4 text-sm text-zinc-700">{event.description}</p>
          </div>
          <div className="shrink-0 w-48">
            <div className="text-sm text-zinc-500">Spots</div>
            <div className="mt-1 text-lg font-medium text-zinc-900">{event.maxAttendees ?? "—"}</div>
            {spotsRemaining !== null && <div className="text-xs text-zinc-500">{spotsRemaining} remaining</div>}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {!registered && spotsRemaining === 0 ? (
            <div className="rounded-full bg-zinc-100 px-4 py-2 text-center text-sm text-zinc-500">Event Full</div>
          ) : registered ? (
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">{JSON.parse(registered.intention || "{}").status || "Registered"}</div>
              <button className="text-sm text-zinc-500">Cancel registration</button>
            </div>
          ) : (
            <div className="space-y-2">
              <RegisterWithIdea onSubmit={(data:any)=>submitRegistration('idea', data)} />
              <RegisterToAttend onSubmit={(data:any)=>submitRegistration('attendee', data)} />
              <RegisterAsInvestor onSubmit={(data:any)=>submitRegistration('investor', data)} />
            </div>
          )}
        </div>

        {/* Host manage panel */}
        {userId && event.organizerId === userId && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-zinc-900">Manage Registrations</h3>
            <ManageRegistrations eventId={event.id} attendees={event.attendees} />
          </div>
        )}
      </div>
    </div>
  );
}

function RegisterWithIdea({ onSubmit }: { onSubmit: (d:any)=>void }) {
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [stage, setStage] = useState("Idea");
  const [support, setSupport] = useState<string[]>([]);
  const [link, setLink] = useState("");

  const toggleSupport = (s:string) => setSupport(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev,s]);

  return (
    <div className="rounded-xl border border-zinc-200 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Register with Idea</div>
        <button onClick={()=>onSubmit({ projectName, projectDesc, stage, support, link })} className="rounded-full bg-red-500 px-3 py-1 text-white text-sm">Submit</button>
      </div>
      <div className="mt-2 text-xs text-zinc-500">Provide brief details about your project to apply to pitch.</div>
    </div>
  );
}

function RegisterToAttend({ onSubmit }: { onSubmit: (d:any)=>void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Professional");
  const [reason, setReason] = useState("");
  return (
    <div className="rounded-xl border border-zinc-200 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Register to Attend</div>
        <button onClick={()=>onSubmit({ name, role, reason })} className="rounded-full bg-red-500 px-3 py-1 text-white text-sm">Register</button>
      </div>
      <div className="mt-2 text-xs text-zinc-500">Quick RSVP to attend.</div>
    </div>
  );
}

function RegisterAsInvestor({ onSubmit }: { onSubmit: (d:any)=>void }) {
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  const [stages, setStages] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [link, setLink] = useState("");
  return (
    <div className="rounded-xl border border-zinc-200 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Register as Investor</div>
        <button onClick={()=>onSubmit({ name, focus, stages, reason, link })} className="rounded-full bg-red-500 px-3 py-1 text-white text-sm">Apply</button>
      </div>
      <div className="mt-2 text-xs text-zinc-500">Investor registrations require host approval.</div>
    </div>
  );
}

function ManageRegistrations({ eventId, attendees }: { eventId: string; attendees: any[] }) {
  const approve = async (id:string) => {
    await fetch(`/api/events/${eventId}/registrations`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attendeeId: id, action: 'approve' }) });
    location.reload();
  };
  const reject = async (id:string) => {
    await fetch(`/api/events/${eventId}/registrations`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attendeeId: id, action: 'reject' }) });
    location.reload();
  };

  const idea = attendees.filter(a=>JSON.parse(a.intention||"{}").regType==='idea');
  const attend = attendees.filter(a=>JSON.parse(a.intention||"{}").regType==='attendee');
  const inv = attendees.filter(a=>JSON.parse(a.intention||"{}").regType==='investor');

  return (
    <div className="mt-3 space-y-3">
      <div>
        <h4 className="text-sm font-medium">Idea Pitchers</h4>
        {idea.map(a=> (
          <div key={a.id} className="mt-2 flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <div className="font-medium">{a.user?.name}</div>
              <div className="text-xs text-zinc-500">{JSON.parse(a.intention||"{}").data?.projectName}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>approve(a.id)} className="text-emerald-600 text-sm">Approve</button>
              <button onClick={()=>reject(a.id)} className="text-red-600 text-sm">Reject</button>
            </div>
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-sm font-medium">Attendees</h4>
        {attend.map(a=> (
          <div key={a.id} className="mt-2 flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <div className="font-medium">{a.user?.name}</div>
              <div className="text-xs text-zinc-500">{JSON.parse(a.intention||"{}").data?.reason}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>approve(a.id)} className="text-emerald-600 text-sm">Approve</button>
              <button onClick={()=>reject(a.id)} className="text-red-600 text-sm">Reject</button>
            </div>
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-sm font-medium">Investors</h4>
        {inv.map(a=> (
          <div key={a.id} className="mt-2 flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <div className="font-medium">{a.user?.name}</div>
              <div className="text-xs text-zinc-500">{JSON.parse(a.intention||"{}").data?.focus}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>approve(a.id)} className="text-emerald-600 text-sm">Approve</button>
              <button onClick={()=>reject(a.id)} className="text-red-600 text-sm">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
