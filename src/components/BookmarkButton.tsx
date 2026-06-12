"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bookmark toggle. Two variants:
 *  - "icon": subtle outline icon for cards (top-right corner)
 *  - "button": labelled "Save for later" button for the project detail page
 */
export default function BookmarkButton({
  projectId,
  variant = "icon",
  initialSaved,
  onToast,
  className,
}: {
  projectId: string;
  variant?: "icon" | "button";
  initialSaved?: boolean;
  onToast?: (message: string) => void;
  className?: string;
}) {
  const [saved, setSaved] = useState(Boolean(initialSaved));
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(initialSaved !== undefined);

  // When no initial state is provided, look it up once.
  useEffect(() => {
    if (initialSaved !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bookmarks");
        if (res.ok && !cancelled) {
          const data = await res.json();
          const found = (data.bookmarks || []).some((b: { project: { id: string } }) => b.project.id === projectId);
          setSaved(found);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, initialSaved]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      if (next) {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });
        if (!res.ok && res.status !== 409) throw new Error();
        onToast?.("Project saved!");
      } else {
        const res = await fetch(`/api/bookmarks/${projectId}`, { method: "DELETE" });
        if (!res.ok && res.status !== 404) throw new Error();
        onToast?.("Bookmark removed");
      }
    } catch {
      setSaved(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  if (variant === "button") {
    return (
      <button
        onClick={toggle}
        disabled={busy || !ready}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-md border px-4 py-1.5 text-xs font-medium transition-colors",
          saved
            ? "border-red-500 bg-red-50 text-red-600"
            : "border-zinc-300 text-zinc-700 hover:bg-zinc-50",
          className
        )}
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-red-600")} />
        {saved ? "Saved" : "Save for later"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove bookmark" : "Save project"}
      title={saved ? "Remove bookmark" : "Save for later"}
      className={cn(
        "rounded-full p-1.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500",
        saved && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-red-500")} />
    </button>
  );
}
