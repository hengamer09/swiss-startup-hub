"use client";

import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InterestButton({
  projectId,
  initialInterested = false,
  size = "sm",
  onToast,
  className,
}: {
  projectId: string;
  initialInterested?: boolean;
  size?: "sm" | "md";
  onToast?: (message: string) => void;
  className?: string;
}) {
  const [interested, setInterested] = useState(initialInterested);
  const [busy, setBusy] = useState(false);

  async function express(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (interested || busy) return;
    setBusy(true);
    setInterested(true); // optimistic
    try {
      const res = await fetch(`/api/projects/${projectId}/interest`, { method: "POST" });
      if (!res.ok) {
        setInterested(false);
        const data = await res.json().catch(() => ({}));
        onToast?.(data.error || "Could not record interest.");
      } else {
        onToast?.("Interest noted! The founder will see this.");
      }
    } catch {
      setInterested(false);
      onToast?.("Could not record interest.");
    } finally {
      setBusy(false);
    }
  }

  const pad = size === "md" ? "px-4 py-2" : "px-3 py-1";
  return (
    <button
      type="button"
      onClick={express}
      disabled={interested || busy}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-colors",
        pad,
        interested
          ? "cursor-default border-green-200 bg-green-50 text-green-700"
          : "border-[#e2e8f0] bg-white text-[#1e40af] hover:bg-blue-50",
        className
      )}
    >
      {interested ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      {interested ? "Interested ✓" : "I'm interested"}
    </button>
  );
}
