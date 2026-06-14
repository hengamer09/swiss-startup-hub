"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (SSR or restricted context)
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white px-4 py-4 shadow-md"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          We use strictly necessary cookies to keep you logged in. No tracking or advertising
          cookies are used.{" "}
          <Link href="/privacy" className="font-medium text-zinc-900 underline hover:text-[#1e40af] transition-colors">
            Learn more
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={accept}
            className="rounded-md bg-[#1e40af] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors focus:outline-2 focus:outline-[#1e40af]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
