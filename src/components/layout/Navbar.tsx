"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Mountain, MessageSquare, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import FeedbackModal from "@/components/FeedbackModal";

export default function Navbar({ onFeedback }: { onFeedback?: () => void }) {
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900">
            <Mountain className="h-5 w-5 text-red-600" />
            <span className="hidden sm:inline">Swiss Startup Hub</span>
          </Link>
          {session && (
            <div className="hidden items-center gap-4 text-sm md:flex">
              <Link href="/feed" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Feed
              </Link>
              <Link href="/events" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Events
              </Link>
              <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Right: auth-state-aware actions */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <button
                onClick={() => {
                  setFeedbackOpen(true);
                  if (onFeedback) onFeedback();
                }}
                className="hidden sm:inline-flex rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Feedback
              </button>
              <Link
                href="/messages"
                className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                  {session.user?.name?.charAt(0) || "U"}
                </div>
                <span className="hidden sm:inline">{session.user?.name}</span>
              </Link>
              <button
                onClick={() => signOut()}
                className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Join for Free
              </Link>
            </>
          )}
          <button className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 transition-colors md:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </nav>
  );
}
