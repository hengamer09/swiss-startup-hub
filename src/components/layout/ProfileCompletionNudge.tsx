"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ProfileCompletionNudge() {
  const [dismissed, setDismissed] = useState(false);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("profile-nudge-dismissed");
    if (stored === "true") {
      setDismissed(true);
      return;
    }
    const saved = localStorage.getItem("profile-completion");
    if (saved) setCompletion(parseInt(saved));
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem("profile-nudge-dismissed", "true");
  }

  if (dismissed || completion >= 100) return null;

  const segments = [
    { label: "Add a bio", done: false, weight: 25 },
    { label: "Add your location", done: false, weight: 25 },
    { label: "Add portfolio links", done: false, weight: 25 },
    { label: "Add skills", done: false, weight: 25 },
  ];

  const missing = segments.filter((s) => !s.done);

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-800">
              Your profile is {completion}% complete
            </p>
            <button
              onClick={dismiss}
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-200">
            <div
              className="h-1.5 rounded-full bg-zinc-500 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Complete your profile to get{" "}
            <strong>3x more responses</strong> from founders and collaborators.
          </p>
          <div className="mt-2 space-y-1">
            {missing.slice(0, 2).map((s) => (
              <p key={s.label} className="text-xs text-zinc-500">
                &rarr; {s.label}
              </p>
            ))}
          </div>
          <Link
            href="/profile/edit"
            className="mt-3 inline-block rounded-md bg-[#1e40af] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8] transition-colors"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
