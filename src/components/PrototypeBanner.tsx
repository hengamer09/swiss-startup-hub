"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "prototype_banner_dismissed";

export default function PrototypeBanner() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") setHidden(true);
  }, []);

  function dismiss() {
    setHidden(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }

  if (hidden) return null;

  return (
    <div
      role="alert"
      className="relative flex h-9 w-full items-center justify-center bg-red-600 px-4 text-center text-xs font-medium text-white sm:text-sm"
    >
      ⚠️ This is a prototype — some features are still being refined
      <button
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white hover:text-white/80"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
