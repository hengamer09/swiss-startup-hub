"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SWISS_CANTONS, SCHOOL_TYPES } from "@/lib/utils";

export default function RegisterSchoolPage() {
  const [form, setForm] = useState({
    name: "", type: "", canton: "", city: "", website: "",
    contactName: "", contactEmail: "", description: "", logo: "",
  });
  const [authorized, setAuthorized] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleLogo(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      set("logo", data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!authorized) return setError("Please confirm you are authorized to register this school.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, authorized }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else setDone(true);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-xl border border-[#e2e8f0] bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-4 text-xl font-semibold text-[#0f172a]">Thank you!</h1>
          <p className="mt-2 text-sm text-[#475569]">
            We&apos;ll review your registration and get back to you within 48 hours.
          </p>
          <Link href="/schools" className="mt-6 inline-block rounded-lg bg-[#1e40af] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8]">
            Back to schools
          </Link>
        </div>
      </div>
    );
  }

  const input = "mt-1 block w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100";
  const label = "block text-sm font-medium text-[#0f172a]";

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href="/schools" className="text-sm text-[#475569] hover:text-[#0f172a]">← Back to schools</Link>
      <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-[#0f172a]">Register your school</h1>
        <p className="mt-1 text-sm text-[#475569]">For teachers, coordinators, and program organizers.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          <div>
            <label className={label}>School name <span className="text-red-500">*</span></label>
            <input type="text" required maxLength={200} value={form.name} onChange={(e) => set("name", e.target.value)} className={input} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Type <span className="text-red-500">*</span></label>
              <select required value={form.type} onChange={(e) => set("type", e.target.value)} className={input}>
                <option value="">Select type</option>
                {SCHOOL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Canton <span className="text-red-500">*</span></label>
              <select required value={form.canton} onChange={(e) => set("canton", e.target.value)} className={input}>
                <option value="">Select canton</option>
                {SWISS_CANTONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>City <span className="text-red-500">*</span></label>
            <input type="text" required maxLength={100} value={form.city} onChange={(e) => set("city", e.target.value)} className={input} />
          </div>

          <div>
            <label className={label}>Website <span className="font-normal text-[#94a3b8]">(optional)</span></label>
            <input type="url" placeholder="https://..." value={form.website} onChange={(e) => set("website", e.target.value)} className={input} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Contact name <span className="text-red-500">*</span></label>
              <input type="text" required maxLength={100} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Contact email <span className="text-red-500">*</span></label>
              <input type="email" required maxLength={255} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={input} />
            </div>
          </div>

          <div>
            <label className={label}>School logo <span className="font-normal text-[#94a3b8]">(optional)</span></label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} className="mt-1 block w-full text-sm" />
            {uploading && <p className="mt-1 text-xs text-[#94a3b8]">Uploading…</p>}
            {form.logo && <img src={form.logo} alt="Logo preview" className="mt-2 h-16 w-16 rounded-lg border border-[#e2e8f0] object-cover" />}
          </div>

          <div>
            <label className={label}>Short description <span className="font-normal text-[#94a3b8]">(optional)</span></label>
            <textarea maxLength={500} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={input} />
          </div>

          <label className="flex items-start gap-2 text-sm text-[#475569]">
            <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="mt-0.5" />
            I confirm I am authorized to register this school.
          </label>

          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#1e40af] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50">
            {submitting ? "Submitting…" : "Register School"}
          </button>
        </form>
      </div>
    </div>
  );
}
