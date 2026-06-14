"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("");
  const [locationScope, setLocationScope] = useState("");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState<number | "">("");
  const [requireApproval, setRequireApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");
      setImage(data.url);
    } catch (err: any) {
      alert(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !date || !time || !eventType) return alert("Please fill required fields");
    const dt = new Date(`${date}T${time}`);
    if (isNaN(dt.getTime()) || dt <= new Date()) return alert("Please choose a future date/time");

    setSubmitting(true);
    const payload = {
      title,
      description,
      date: dt.toISOString(),
      location: isOnline ? "Online" : location,
      eventType,
      locationScope,
      maxAttendees: maxAttendees || null,
      requireApproval,
      image,
    };

    const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      const data = await res.json();
      router.push(`/events/${data.id}`);
    } else {
      const err = await res.json();
      alert(err.error || err.message || "Failed to create event");
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">Create Event</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2" required />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} /> Online
          </label>
          {!isOnline && (
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (city)" className="flex-1 rounded-lg border border-zinc-200 px-3 py-2" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2" required>
            <option value="">Select type</option>
            <option>Pitch Night</option>
            <option>Workshop</option>
            <option>Networking</option>
            <option>Hackathon</option>
            <option>Other</option>
          </select>
          <select value={locationScope} onChange={(e) => setLocationScope(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2">
            <option value="">Select scope</option>
            <option>Local</option>
            <option>National</option>
            <option>International</option>
            <option>Online</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" value={maxAttendees === "" ? "" : String(maxAttendees)} onChange={(e) => setMaxAttendees(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Max attendees (optional)" className="rounded-lg border border-zinc-200 px-3 py-2" />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} /> Require approval for registrations
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Event image</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2" />
          {uploading && <p className="mt-1 text-xs text-zinc-500">Uploading image…</p>}
          {image && <img src={image} alt="Event preview" className="mt-3 h-20 w-20 rounded-xl object-cover border" />}
        </div>

        <div>
          <button type="submit" disabled={submitting} className="rounded-md bg-[#1e40af] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">
            {submitting ? "Creating…" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
