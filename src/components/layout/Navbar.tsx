"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Mountain, Bell, MessageSquare, Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import FeedbackModal from "@/components/FeedbackModal";

export default function Navbar({ onFeedback }: { onFeedback?: () => void }) {
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackPreselect, setFeedbackPreselect] = useState<"review" | undefined>(undefined);

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
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900">
            <Mountain className="h-5 w-5 text-red-500" />
            <span className="hidden sm:inline">Swiss Startup Hub</span>
          </Link>
          {session && (
            <div className="hidden items-center gap-4 text-sm md:flex">
              <Link href="/feed" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Feed
              </Link>
              <Link href="/search" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                <Search className="h-4 w-4 inline mr-1" />
                Discover
              </Link>
              <Link href="/events" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Events
              </Link>
              <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setFeedbackPreselect("review");
                  setFeedbackOpen(true);
                }}
                className="text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Prototype
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFeedbackPreselect(undefined);
              setFeedbackOpen(true);
              if (onFeedback) onFeedback();
            }}
            className="rounded-full bg-fuchsia-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-fuchsia-600"
          >
            Feedback
          </button>
          {session ? (
            <>
              <Link
                href="/messages"
                className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard"
                className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100 transition-colors"
                aria-label="Open dashboard"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">
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
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Join Free
              </Link>
            </div>
          )}
          <button className="rounded-full p-2 text-zinc-600 hover:bg-zinc-100 transition-colors md:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        preselect={feedbackPreselect}
      />
    </nav>
  );
}
