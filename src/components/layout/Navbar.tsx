"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Mountain, MessageSquare, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import FeedbackModal from "@/components/FeedbackModal";
import { useWaitlist } from "@/components/waitlist/WaitlistProvider";

export default function Navbar({ onFeedback }: { onFeedback?: () => void }) {
  const { data: session } = useSession();
  const { open: openWaitlist } = useWaitlist();
  const [unread, setUnread] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const feedbackTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!session?.user) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/messages/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnread(data.count || 0);
        }
      } catch {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900 focus:outline-2 focus:outline-red-600 focus:rounded-sm">
            <Mountain className="h-5 w-5 text-red-600" aria-hidden="true" />
            <span className="hidden sm:inline">Swiss Startup Hub</span>
          </Link>
          {session && (
            <div className="hidden items-center gap-4 text-sm md:flex">
              <Link href="/feed" className="text-zinc-600 hover:text-zinc-900 transition-colors focus:outline-2 focus:outline-red-600 focus:rounded-sm">
                Feed
              </Link>
              <Link href="/events" className="text-zinc-600 hover:text-zinc-900 transition-colors focus:outline-2 focus:outline-red-600 focus:rounded-sm">
                Events
              </Link>
              <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900 transition-colors focus:outline-2 focus:outline-red-600 focus:rounded-sm">
                Dashboard
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={openWaitlist}
            className="hidden rounded-md border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-2 focus:outline-red-600 md:inline-flex"
          >
            Join Waitlist
          </button>
        </div>

        {/* Right: auth-state-aware actions */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <button
                ref={feedbackTriggerRef}
                onClick={() => {
                  setFeedbackOpen(true);
                  if (onFeedback) onFeedback();
                }}
                aria-label="Open feedback form"
                className="hidden sm:inline-flex rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-2 focus:outline-red-800"
              >
                Feedback
              </button>
              <Link
                href="/messages"
                aria-label={unread > 0 ? `Messages — ${unread} unread` : "Messages"}
                className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100 transition-colors focus:outline-2 focus:outline-red-600"
              >
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white" aria-hidden="true">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                aria-label={`Go to profile for ${session.user?.name || "your account"}`}
                className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors focus:outline-2 focus:outline-red-600"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white" aria-hidden="true">
                  {session.user?.name?.charAt(0) || "U"}
                </div>
                <span className="hidden sm:inline">{session.user?.name}</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                aria-label="Sign out of your account"
                className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors focus:outline-2 focus:outline-red-600 focus:rounded-sm"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors focus:outline-2 focus:outline-red-600 focus:rounded-sm"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors focus:outline-2 focus:outline-red-800"
              >
                Join for Free
              </Link>
            </>
          )}
          <button
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 transition-colors md:hidden focus:outline-2 focus:outline-red-600"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2 text-sm">
            {session && (
              <>
                <Link href="/feed" onClick={() => setMenuOpen(false)} className="py-1 text-zinc-700 hover:text-zinc-900">Feed</Link>
                <Link href="/events" onClick={() => setMenuOpen(false)} className="py-1 text-zinc-700 hover:text-zinc-900">Events</Link>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="py-1 text-zinc-700 hover:text-zinc-900">Dashboard</Link>
              </>
            )}
            <button
              type="button"
              onClick={() => { setMenuOpen(false); openWaitlist(); }}
              className="py-1 text-left font-medium text-red-600 hover:text-red-700"
            >
              Join Waitlist
            </button>
            {!session && (
              <>
                <Link href="/auth/signin" onClick={() => setMenuOpen(false)} className="py-1 text-zinc-700 hover:text-zinc-900">Login</Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="py-1 text-zinc-700 hover:text-zinc-900">Join for Free</Link>
              </>
            )}
          </div>
        </div>
      )}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => {
          setFeedbackOpen(false);
          feedbackTriggerRef.current?.focus();
        }}
      />
    </nav>
  );
}
