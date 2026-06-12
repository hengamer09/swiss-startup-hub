"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mountain, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "verified" | "invalid" | "expired" | "error";

function VerifyInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "invalid");

  // Resend form state
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.status === "verified") setStatus("verified");
        else if (data.status === "expired") setStatus("expired");
        else if (data.status === "invalid") setStatus("invalid");
        else setStatus("error");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResending(true);
    setResendError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendError(data.error || "Could not send the email. Please try again.");
      } else {
        setResent(true);
      }
    } catch {
      setResendError("Could not send the email. Please try again.");
    } finally {
      setResending(false);
    }
  }

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
            <p className="mt-4 text-sm text-zinc-600">Verifying your email…</p>
          </div>
        )}

        {status === "verified" && (
          <div className="py-2">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">Email verified!</h1>
            <p className="mt-2 text-sm text-zinc-600">You can now log in to your account.</p>
            <Link
              href="/auth/signin"
              className="mt-6 inline-block rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        )}

        {(status === "invalid" || status === "expired" || status === "error") && (
          <div className="py-2">
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              {status === "error" ? "Something went wrong" : "This link is invalid or has expired."}
            </h1>
            {resent ? (
              <p className="mt-3 text-sm text-zinc-600">
                If an account exists for that email, we&apos;ve sent a new verification link.
                Please check your inbox.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-zinc-600">
                  Enter your email to receive a new verification link.
                </p>
                <form onSubmit={handleResend} className="mt-4 space-y-3 text-left">
                  {resendError && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      {resendError}
                    </div>
                  )}
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button
                    type="submit"
                    disabled={resending}
                    className="w-full rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {resending ? "Sending…" : "Resend verification email"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
