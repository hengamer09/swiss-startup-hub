"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { X, CheckCircle2, Briefcase, Banknote, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "FOUNDER", label: "Founder", icon: Rocket },
  { value: "PROFESSIONAL", label: "Professional", icon: Briefcase },
  { value: "INVESTOR", label: "Investor", icon: Banknote },
] as const;

export default function WaitlistModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | "success" | "duplicate">(null);
  const [error, setError] = useState("");

  // Pre-fill from the logged-in profile and reset on open.
  useEffect(() => {
    if (isOpen) {
      setName(session?.user?.name || "");
      setEmail(session?.user?.email || "");
      setRole("");
      setMessage("");
      setDone(null);
      setError("");
      setSubmitting(false);
    }
  }, [isOpen, session]);

  // Auto-close 3s after success.
  useEffect(() => {
    if (done === "success") {
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [done, onClose]);

  // Esc to close.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!role) return setError("Please select your role.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role, message: message.trim() }),
      });
      if (res.ok) {
        setDone("success");
      } else if (res.status === 409) {
        setDone("duplicate");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Join the waitlist"
        className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">🚀 Join the Waitlist</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done === "success" ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <p className="mt-4 font-medium text-zinc-900">🎉 You&apos;re on the list!</p>
            <p className="mt-1 text-sm text-zinc-500">We&apos;ll notify you when new features launch.</p>
          </div>
        ) : done === "duplicate" ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <p className="mt-4 font-medium text-zinc-900">You&apos;re already on the waitlist!</p>
            <p className="mt-1 text-sm text-zinc-500">No need to sign up again — we&apos;ve got you.</p>
            <button
              onClick={onClose}
              className="mt-5 rounded-md border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}
            <div>
              <label htmlFor="wl-name" className="block text-sm font-medium text-zinc-700">Name</label>
              <input
                id="wl-name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              />
            </div>
            <div>
              <label htmlFor="wl-email" className="block text-sm font-medium text-zinc-700">Email</label>
              <input
                id="wl-email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700">I am a...</p>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    aria-pressed={role === value}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border-2 p-3 text-sm transition-colors",
                      role === value
                        ? "border-[#1e40af] bg-blue-50 text-[#1e40af]"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="wl-msg" className="block text-sm font-medium text-zinc-700">
                What are you working on? <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <textarea
                id="wl-msg"
                maxLength={500}
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us briefly about your project or what you're looking for..."
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[#1e40af] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors"
            >
              {submitting ? "Joining..." : "Join the Waitlist →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
