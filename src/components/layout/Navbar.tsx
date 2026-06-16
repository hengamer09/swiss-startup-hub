"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { MessageSquare, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import FeedbackModal from "@/components/FeedbackModal";
import { useWaitlist } from "@/components/waitlist/WaitlistProvider";

// Primary areas of the app, each with its own accent underline so the active
// section is unmistakable.
const NAV_LINKS = [
  { href: "/feed", label: "Feed", accent: "border-blue-600" },
  { href: "/events", label: "Events", accent: "border-amber-500" },
  { href: "/schools", label: "Schools", accent: "border-purple-600" },
  { href: "/mentors", label: "Mentors", accent: "border-teal-600" },
  { href: "/dashboard", label: "Dashboard", accent: "border-zinc-900" },
];

export default function Navbar({ onFeedback }: { onFeedback?: () => void }) {
  const { data: session } = useSession();
  const { open: openWaitlist } = useWaitlist();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const feedbackTriggerRef = useRef<HTMLButtonElement>(null);

  const isActive = (href: string) =>
    href === "/feed" ? pathname?.startsWith("/feed") || pathname?.startsWith("/projects") : pathname?.startsWith(href);

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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2 focus:rounded-sm focus:outline-2 focus:outline-[#1e40af]">
            <span className="h-4 w-4 rotate-45 bg-[#1e40af] transition-transform group-hover:rotate-[135deg]" aria-hidden="true" />
            <span className="hidden text-sm font-bold uppercase tracking-[0.16em] text-zinc-900 sm:inline">
              Swiss Startup Hub
            </span>
          </Link>
          {session && (
            <div className="hidden items-stretch md:flex">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center border-b-2 px-3 text-sm font-medium transition-colors focus:outline-2 focus:outline-[#1e40af] ${
                      active
                        ? `${link.accent} text-zinc-900`
                        : "border-transparent text-zinc-500 hover:text-zinc-900"
                    }`}
                    style={{ height: "4rem" }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
          {!session && (
            <button
              type="button"
              onClick={openWaitlist}
              className="hidden rounded-lg border border-[#1e40af] bg-white px-4 py-2 text-sm font-medium text-[#1e40af] transition-colors hover:bg-blue-50 focus:outline-2 focus:outline-[#1e40af] md:inline-flex"
            >
              Join Waitlist
            </button>
          )}
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
                className="hidden sm:inline-flex rounded-lg border border-[#1e40af] bg-white px-4 py-1.5 text-sm font-medium text-[#1e40af] transition-colors hover:bg-blue-50 focus:outline-2 focus:outline-[#1e40af]"
              >
                Feedback
              </button>
              <Link
                href="/messages"
                aria-label={unread > 0 ? `Messages — ${unread} unread` : "Messages"}
                className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100 transition-colors focus:outline-2 focus:outline-[#1e40af]"
              >
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1e40af] px-1 text-[10px] font-bold text-white" aria-hidden="true">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                aria-label={`Go to profile for ${session.user?.name || "your account"}`}
                className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors focus:outline-2 focus:outline-[#1e40af]"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1e40af] text-xs text-white" aria-hidden="true">
                  {session.user?.name?.charAt(0) || "U"}
                </div>
                <span className="hidden sm:inline">{session.user?.name}</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                aria-label="Sign out of your account"
                className="hidden text-xs text-zinc-500 hover:text-zinc-700 transition-colors focus:outline-2 focus:outline-[#1e40af] focus:rounded-sm sm:block"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors focus:outline-2 focus:outline-[#1e40af] focus:rounded-sm"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg bg-[#1e40af] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors focus:outline-2 focus:outline-[#1e40af]"
              >
                Join for Free
              </Link>
            </>
          )}
          <button
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 transition-colors md:hidden focus:outline-2 focus:outline-[#1e40af]"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile menu — full-width dropdown, large tap targets */}
      {menuOpen && (
        <div className="border-t border-zinc-200 bg-white md:hidden">
          <div className="flex flex-col divide-y divide-zinc-100 px-4 text-sm">
            {session ? (
              <>
                <Link href="/feed" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-zinc-700 hover:text-[#1e40af]">Feed</Link>
                <Link href="/events" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-zinc-700 hover:text-[#1e40af]">Events</Link>
                <Link href="/schools" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-zinc-700 hover:text-[#1e40af]">Schools</Link>
                <Link href="/mentors" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-zinc-700 hover:text-[#1e40af]">Mentors</Link>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-zinc-700 hover:text-[#1e40af]">Dashboard</Link>
                <Link href="/messages" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center justify-between text-zinc-700 hover:text-[#1e40af]">
                  <span>Messages</span>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1e40af] px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-zinc-700 hover:text-[#1e40af]">Profile</Link>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); openWaitlist(); }}
                  className="flex min-h-12 items-center text-left font-medium text-[#1e40af]"
                >
                  Join Waitlist
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setFeedbackOpen(true); }}
                  className="flex min-h-12 items-center text-left text-zinc-700 hover:text-[#1e40af]"
                >
                  Feedback
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="flex min-h-12 items-center text-left text-zinc-500 hover:text-zinc-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); openWaitlist(); }}
                  className="flex min-h-12 items-center text-left font-medium text-[#1e40af]"
                >
                  Join Waitlist
                </button>
                <Link href="/schools" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-zinc-700 hover:text-[#1e40af]">Schools</Link>
                <Link href="/mentors" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-zinc-700 hover:text-[#1e40af]">Mentors</Link>
                <Link href="/auth/signin" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-zinc-700 hover:text-[#1e40af]">Login</Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center font-medium text-[#1e40af]">Join for Free</Link>
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
