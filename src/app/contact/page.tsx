"use client";

import { useState } from "react";
import Link from "next/link";
import { Mountain, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
          <Mountain className="h-4 w-4 text-red-500" />
          Swiss Startup Hub
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-zinc-900">Contact</h1>
      <p className="mt-3 text-zinc-600 leading-relaxed">
        Have a question, a bug report, or partnership inquiry? We&apos;d love to hear from you.
      </p>

      <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-8">
        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
            <h2 className="text-lg font-semibold text-zinc-900">Your message has been sent!</h2>
            <p className="mt-2 text-sm text-zinc-500">
              We typically respond within 1–2 business days.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); }}
              className="mt-6 rounded-md border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="How can we help?"
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>

      <p className="mt-8 text-sm text-zinc-500">
        You can also use the{" "}
        <span className="font-medium text-zinc-700">Feedback</span> button in the app
        to share product feedback or report issues directly — it goes straight to the team.
      </p>
    </div>
  );
}
