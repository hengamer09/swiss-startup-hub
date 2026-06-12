"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = {
  open: boolean;
  message: string;
  tone: "success" | "error";
};

function parseIntention(intention: string) {
  try {
    return JSON.parse(intention || "{}") as { message?: string };
  } catch {
    return {};
  }
}

function getPrimaryRole(roles: string) {
  try {
    const parsed = JSON.parse(roles || "[]") as string[];
    const role = parsed.find((item) =>
      ["INVESTOR", "FOUNDER", "PROFESSIONAL"].includes(item)
    );
    if (!role) return "Professional";
    return role.charAt(0) + role.slice(1).toLowerCase();
  } catch {
    return "Professional";
  }
}

function formatTime(date: string) {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventDetail({
  event,
  userId,
}: {
  event: any;
  userId: string | null;
}) {
  const registered = event.attendees?.find((attendee: any) => attendee.userId === userId);
  const spotsRemaining = event.maxAttendees
    ? Math.max(0, event.maxAttendees - (event.attendees?.length || 0))
    : null;
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerMessage, setRegisterMessage] = useState("");
  const [registering, setRegistering] = useState(false);
  const [attendees, setAttendees] = useState<any[]>(event.attendees || []);
  const [posts, setPosts] = useState<any[]>([]);
  const [postDraft, setPostDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [showHostMessage, setShowHostMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<Toast>({
    open: false,
    message: "",
    tone: "success",
  });

  useEffect(() => {
    if (!toast.open) return;

    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast.open]);

  useEffect(() => {
    async function loadPosts() {
      const res = await fetch(`/api/events/${event.id}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    }

    loadPosts();
  }, [event.id]);

  async function submitRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || registering) return;

    setRegistering(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: registerMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setAttendees((current) => [data.attendee, ...current]);
        setShowRegisterForm(false);
        setRegisterMessage("");
        setToast({
          open: true,
          message: "You have been added to the attendee list!",
          tone: "success",
        });
        return;
      }

      setToast({
        open: true,
        message: "Something went wrong. Please try again.",
        tone: "error",
      });
    } catch {
      setToast({
        open: true,
        message: "Something went wrong. Please try again.",
        tone: "error",
      });
    } finally {
      setRegistering(false);
    }
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || posting || !postDraft.trim()) return;

    setPosting(true);
    const res = await fetch(`/api/events/${event.id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: postDraft.trim() }),
    });

    if (res.ok) {
      const post = await res.json();
      setPosts((current) => [...current, post]);
      setPostDraft("");
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }

    setPosting(false);
  }

  const isFull = spotsRemaining === 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-zinc-900">{event.title}</h1>
        <p className="text-sm text-zinc-500">
          Hosted by{" "}
          <Link href={`/profile/${event.organizer?.id}`} className="font-medium text-red-500 hover:underline">
            {event.organizer?.name}
          </Link>
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium">
                {event.eventType}
              </span>
              <span className="text-sm text-zinc-600">
                {new Date(event.date).toLocaleString()}
              </span>
              <span className="text-sm text-zinc-600">{event.location}</span>
            </div>
            <p className="mt-4 text-sm text-zinc-700">{event.description}</p>
          </div>
          <div className="shrink-0 rounded-lg border border-zinc-200 px-4 py-3 text-sm">
            <div className="text-zinc-500">Spots</div>
            <div className="mt-1 text-lg font-semibold text-zinc-900">
              {event.maxAttendees ?? "Open"}
            </div>
            {spotsRemaining !== null && (
              <div className="text-xs text-zinc-500">{spotsRemaining} remaining</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-100 pt-5">
          {!userId ? (
            <Link
              href="/auth/signin"
              className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Sign in to attend
            </Link>
          ) : registered || attendees.some((attendee) => attendee.userId === userId) ? (
            <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
              You are on the attendee list
            </div>
          ) : isFull ? (
            <div className="rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
              Event Full
            </div>
          ) : (
            <button
              onClick={() => setShowRegisterForm((current) => !current)}
              className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Request to Attend
            </button>
          )}

          {userId && event.organizerId !== userId && (
            <button
              onClick={() => setShowHostMessage(true)}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              <MessageSquare className="h-4 w-4" />
              Message Host
            </button>
          )}
        </div>

        {showRegisterForm && (
          <form onSubmit={submitRegistration} className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <label className="block text-sm font-medium text-zinc-700">
              Anything you want the host to know?
            </label>
            <textarea
              value={registerMessage}
              onChange={(e) => setRegisterMessage(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Optional"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={registering}
                className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {registering ? "Sending..." : "Send Request"}
              </button>
            </div>
          </form>
        )}

        {userId && event.organizerId === userId && (
          <section className="mt-8 border-t border-zinc-100 pt-6">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-900">Attendee List</h2>
            </div>
            {attendees.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-500">
                No attendees yet.
              </div>
            ) : (
              <div className="space-y-2">
                {attendees.map((attendee) => {
                  const details = parseIntention(attendee.intention);
                  return (
                    <div key={attendee.id} className="rounded-lg border border-zinc-200 p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                          {attendee.user?.image ? (
                            <img src={attendee.user.image} alt={attendee.user.name || "Attendee"} className="h-full w-full object-cover" />
                          ) : (
                            (attendee.user?.name || "A").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-900">
                              {attendee.user?.name}
                            </span>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {getPrimaryRole(attendee.user?.roles || "[]")}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {formatTime(attendee.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-600">
                            {details.message || "No message provided."}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      <section id="discussion" className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Public Chat</h2>
          <p className="text-xs text-zinc-500">Visible to everyone. Only signed-in users can post.</p>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto mb-3">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              No event chat messages yet.
            </div>
          ) : (
            posts.map((post) => {
              const isOrganizer = post.author?.id === event.organizerId;
              return (
                <div key={post.id} className={cn("flex gap-2", isOrganizer ? "justify-end" : "justify-start")}>
                  {!isOrganizer && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 self-end">
                      {(post.author?.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={cn("max-w-[75%] flex flex-col", isOrganizer ? "items-end" : "items-start")}>
                    {!isOrganizer && <p className="mb-0.5 text-xs font-semibold text-zinc-600">{post.author?.name || "Anonymous"}</p>}
                    <div className={cn("rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      isOrganizer ? "bg-red-600 text-white rounded-br-md" : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                    )}>
                      <p className="whitespace-pre-wrap">{post.content}</p>
                      <p className={cn("mt-1 text-xs text-right", isOrganizer ? "text-red-200" : "text-zinc-400")}>
                        {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {userId ? (
          <form onSubmit={submitPost} className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <textarea
              value={postDraft}
              onChange={(e) => setPostDraft(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Share a question, prep note, or event thought..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-400">{postDraft.length}/500</p>
              <button
                type="submit"
                disabled={posting || !postDraft.trim()}
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {posting ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-500">
            Sign in to post in the event chat.
          </div>
        )}
      </section>

      {showHostMessage && (
        <MessageHostModal
          eventId={event.id}
          eventTitle={event.title}
          hostId={event.organizerId}
          onClose={() => setShowHostMessage(false)}
        />
      )}

      {toast.open && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-[60] rounded-xl border px-4 py-3 text-sm shadow-lg",
            toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function MessageHostModal({
  eventId,
  eventTitle,
  hostId,
  onClose,
}: {
  eventId: string;
  eventTitle: string;
  hostId: string;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: hostId,
        content: content.trim(),
        eventId: eventId,
      }),
    });

    if (res.ok) setSent(true);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        {sent ? (
          <div className="text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-green-500" />
            <h3 className="mt-3 text-lg font-semibold text-zinc-900">Message sent!</h3>
            <p className="mt-1 text-sm text-zinc-500">The host will get it in their inbox.</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-zinc-900">Message Host</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={500}
                rows={4}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="Ask the host a private question..."
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {loading ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
