"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mountain, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "done" | "error";

function UnsubscribeInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        setStatus(res.ok ? "done" : "error");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
        <Link
          href="/"
          className="mx-auto mb-6 flex w-fit items-center gap-2 text-lg font-semibold text-zinc-900"
        >
          <Mountain className="h-6 w-6 text-red-600" />
          Swiss Startup Hub
        </Link>

        {status === "loading" && (
          <div className="py-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" />
            <p className="mt-4 text-sm text-zinc-600">Updating your preferences…</p>
          </div>
        )}

        {status === "done" && (
          <div className="py-2">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              You have been unsubscribed from Swiss Startup Hub emails.
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              You will no longer receive newsletter emails from us.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Back to home
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="py-2">
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              This unsubscribe link is invalid.
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Please use the unsubscribe link from a recent email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeInner />
    </Suspense>
  );
}
