"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function tryParse(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationThread({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Join request decision state
  const [joinRole, setJoinRole] = useState("");
  const [joinReason, setJoinReason] = useState("");
  const [joinProcessing, setJoinProcessing] = useState(false);
  const [joinError, setJoinError] = useState("");

  // Event registration decision state
  const [eventReason, setEventReason] = useState("");
  const [eventProcessing, setEventProcessing] = useState(false);
  const [eventError, setEventError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/messages/${conversationId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      setParticipants(data.participants || []);
      setProject(data.project || null);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    fetch(`/api/messages/${conversationId}/read`, { method: "PUT" });
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
      fetch(`/api/messages/${conversationId}/read`, { method: "PUT" });
    }, 10000);
    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function scrollToMessage(msgId: string) {
    document.getElementById(`msg-${msgId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleJoinDecision(status: "APPROVED" | "REJECTED", joinRequestId: string) {
    const role = joinRole.trim();
    const reason = joinReason.trim();
    if (status === "APPROVED" && !role) {
      setJoinError("Please enter a role title before accepting.");
      return;
    }
    if (!reason) {
      setJoinError("Please add a message before submitting.");
      return;
    }
    setJoinError("");
    setJoinProcessing(true);
    try {
      const res = await fetch(`/api/join-requests/${joinRequestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, role, reason }),
      });
      if (res.ok) {
        setJoinRole("");
        setJoinReason("");
        await fetchMessages();
      } else {
        const data = await res.json().catch(() => ({}));
        setJoinError(data.error || "Something went wrong. Please try again.");
      }
    } finally {
      setJoinProcessing(false);
    }
  }

  async function handleEventDecision(action: "ACCEPT" | "DECLINE", msg: any) {
    const reason = eventReason.trim();
    if (!reason) {
      setEventError("A note is required.");
      return;
    }
    const parsed = tryParse(msg.content) || {};
    const registrantId = parsed.registrantId || msg.senderId;
    const evtId = parsed.eventId || msg.event?.id;
    if (!evtId || !registrantId) {
      setEventError("Unable to process — missing event information.");
      return;
    }
    setEventError("");
    setEventProcessing(true);
    try {
      const res = await fetch(`/api/events/${evtId}/registrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrantId, action, reason, conversationId }),
      });
      if (res.ok) {
        setEventReason("");
        await fetchMessages();
      } else {
        const data = await res.json().catch(() => ({}));
        setEventError(data.error || "Something went wrong.");
      }
    } finally {
      setEventProcessing(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const other = participants.find((p: any) => p.userId !== userId);
    if (!other) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: other.userId,
          content: input.trim(),
          projectId: project?.id || null,
        }),
      });
      if (res.ok) {
        setInput("");
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-1 items-center justify-center px-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  const other = participants.find((p: any) => p.userId !== userId)?.user;

  // Compute pending pin from messages (last unresolved pending request visible to current user)
  let pendingPin: { msgId: string; label: string } | null = null;
  for (const msg of messages) {
    if (msg.type === "JOIN_REQUEST" && msg.receiverId === userId) {
      const hasResponse = messages.some(
        (m: any) => (m.type === "JOIN_ACCEPT" || m.type === "JOIN_DECLINE") && m.createdAt > msg.createdAt
      );
      if (!hasResponse) {
        const d = tryParse(msg.content) || {};
        pendingPin = { msgId: msg.id, label: `Join request pending — ${d.applicantRole || "view request"}` };
      }
    }
    if (msg.type === "EVENT_REGISTRATION" && msg.receiverId === userId) {
      const hasResponse = messages.some(
        (m: any) => (m.type === "EVENT_ACCEPT" || m.type === "EVENT_DECLINE") && m.createdAt > msg.createdAt
      );
      if (!hasResponse) {
        const d = tryParse(msg.content) || {};
        pendingPin = { msgId: msg.id, label: `Event registration pending — ${d.attendeeName || "view request"}` };
      }
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/messages" className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">{other?.name || "Unknown"}</h1>
          {project && (
            <Link href={`/projects/${project.id}`} className="text-xs text-red-500 hover:underline font-medium">
              {project.name}
            </Link>
          )}
        </div>
      </div>

      {/* Pinned bar — scrolls to the pending request card in the thread */}
      {pendingPin && (
        <button
          onClick={() => scrollToMessage(pendingPin!.msgId)}
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <span>📌</span>
          <span className="flex-1">{pendingPin.label}</span>
          <span className="text-amber-500">↓ scroll</span>
        </button>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pb-4 max-h-[60vh]">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg: any) => {
            const isMine = msg.senderId === userId;
            const type = msg.type || "NORMAL";
            const parsed = (type !== "NORMAL" && type !== "BOT_NOTIFICATION") ? tryParse(msg.content) : null;

            const contextLabel = msg.project
              ? { href: `/projects/${msg.project.id}`, name: `via ${msg.project.name}` }
              : msg.event
              ? { href: `/events/${msg.event.id}`, name: `via ${msg.event.title}` }
              : null;

            if (type === "BOT_NOTIFICATION") {
              const projectId = msg.project?.id;
              const eventId = msg.event?.id;
              const discussionUrl = projectId
                ? `/projects/${projectId}#discussion`
                : eventId
                ? `/events/${eventId}#discussion`
                : null;
              const hasViewLink = msg.content.includes("— View discussion");
              const textPart = hasViewLink
                ? msg.content.replace(/\s*—\s*View discussion\s*$/, "")
                : msg.content;
              return (
                <div key={msg.id} id={`msg-${msg.id}`} className="flex justify-center">
                  <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 italic max-w-[85%] text-center">
                    {textPart}
                    {discussionUrl && hasViewLink && (
                      <>{" — "}<Link href={discussionUrl} className="underline hover:text-zinc-700 not-italic">View discussion</Link></>
                    )}
                    {!discussionUrl && hasViewLink && " — View discussion"}
                  </div>
                </div>
              );
            }

            if (type === "JOIN_REQUEST") {
              const data = parsed || {};
              const hasResponse = messages.some(
                (m: any) => (m.type === "JOIN_ACCEPT" || m.type === "JOIN_DECLINE") && m.createdAt > msg.createdAt
              );
              const canAct = msg.receiverId === userId && !hasResponse;
              return (
                <div key={msg.id} id={`msg-${msg.id}`} className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <p className="text-sm font-semibold text-amber-900">Join Request from {msg.sender?.name}</p>
                    {data.projectName && <p className="text-xs text-amber-700">Project: {data.projectName}</p>}
                    {data.applicantRole && <p className="text-xs text-amber-800"><span className="font-medium">Role:</span> {data.applicantRole}</p>}
                    {data.motivation && <p className="text-xs text-amber-800"><span className="font-medium">Message:</span> {data.motivation}</p>}
                    {data.links && (
                      <p className="text-xs text-amber-800">
                        <span className="font-medium">Portfolio:</span>{" "}
                        <a href={data.links} target="_blank" rel="noopener noreferrer" className="underline">{data.links}</a>
                      </p>
                    )}
                    <p className="text-xs text-amber-600">{formatTime(msg.createdAt)}</p>
                    {canAct && (
                      <div className="space-y-2 pt-2 border-t border-amber-200">
                        <div>
                          <p className="text-xs font-medium text-amber-700 mb-1">Role title (for accept)</p>
                          <input
                            type="text"
                            value={joinRole || data.applicantRole || ""}
                            onChange={(e) => { setJoinRole(e.target.value); if (joinError) setJoinError(""); }}
                            placeholder="e.g. Frontend Engineer"
                            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-amber-700 mb-1">Message to applicant (required)</p>
                          <textarea
                            value={joinReason}
                            onChange={(e) => { setJoinReason(e.target.value); if (joinError) setJoinError(""); }}
                            placeholder="Add a note for the applicant..."
                            rows={2}
                            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        {joinError && <p className="text-xs text-red-600">{joinError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleJoinDecision("APPROVED", data.joinRequestId)}
                            disabled={joinProcessing}
                            className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3" /> Accept
                          </button>
                          <button
                            onClick={() => handleJoinDecision("REJECTED", data.joinRequestId)}
                            disabled={joinProcessing}
                            className="flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" /> Decline
                          </button>
                        </div>
                      </div>
                    )}
                    {hasResponse && <p className="text-xs text-amber-600 italic">Request resolved</p>}
                  </div>
                </div>
              );
            }

            if (type === "JOIN_ACCEPT") {
              return (
                <div key={msg.id} id={`msg-${msg.id}`} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div className="max-w-[80%] rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
                    {contextLabel && (
                      <Link href={contextLabel.href} className="block text-xs text-zinc-400 hover:underline mb-1">{contextLabel.name}</Link>
                    )}
                    <p className="text-sm text-green-800">{msg.content}</p>
                    <p className="mt-1 text-right text-xs text-green-500">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            }

            if (type === "JOIN_DECLINE") {
              return (
                <div key={msg.id} id={`msg-${msg.id}`} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div className="max-w-[80%] rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                    {contextLabel && (
                      <Link href={contextLabel.href} className="block text-xs text-zinc-400 hover:underline mb-1">{contextLabel.name}</Link>
                    )}
                    <p className="text-sm text-red-800">{msg.content}</p>
                    <p className="mt-1 text-right text-xs text-red-400">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            }

            if (type === "EVENT_REGISTRATION") {
              const data = parsed || {};
              const hasResponse = messages.some(
                (m: any) => (m.type === "EVENT_ACCEPT" || m.type === "EVENT_DECLINE") && m.createdAt > msg.createdAt
              );
              const canAct = msg.receiverId === userId && !hasResponse;
              return (
                <div key={msg.id} id={`msg-${msg.id}`} className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
                    <p className="text-sm font-semibold text-amber-900">Event Registration: {data.eventTitle || "Event"}</p>
                    <p className="text-xs text-amber-800">From: {data.attendeeName || msg.sender?.name}</p>
                    {data.attendeeMessage && <p className="text-xs text-amber-800">Message: {data.attendeeMessage}</p>}
                    <p className="text-xs text-amber-600">{formatTime(msg.createdAt)}</p>
                    {canAct && (
                      <div className="space-y-2 pt-2 border-t border-amber-200">
                        <div>
                          <p className="text-xs font-medium text-amber-700 mb-1">Note to attendee (required)</p>
                          <textarea
                            value={eventReason}
                            onChange={(e) => { setEventReason(e.target.value); if (eventError) setEventError(""); }}
                            placeholder="e.g. Looking forward to seeing you!"
                            rows={2}
                            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        {eventError && <p className="text-xs text-red-600">{eventError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEventDecision("ACCEPT", msg)}
                            disabled={eventProcessing}
                            className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3" /> Confirm
                          </button>
                          <button
                            onClick={() => handleEventDecision("DECLINE", msg)}
                            disabled={eventProcessing}
                            className="flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" /> Decline
                          </button>
                        </div>
                      </div>
                    )}
                    {hasResponse && <p className="text-xs text-amber-600 italic">Registration resolved</p>}
                  </div>
                </div>
              );
            }

            if (type === "EVENT_ACCEPT") {
              return (
                <div key={msg.id} id={`msg-${msg.id}`} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div className="max-w-[80%] rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
                    {contextLabel && (
                      <Link href={contextLabel.href} className="block text-xs text-zinc-400 hover:underline mb-1">{contextLabel.name}</Link>
                    )}
                    <p className="text-xs font-semibold text-green-700 mb-1">Registration Confirmed ✓</p>
                    <p className="text-sm text-green-800">{msg.content}</p>
                    <p className="mt-1 text-right text-xs text-green-500">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            }

            if (type === "EVENT_DECLINE") {
              return (
                <div key={msg.id} id={`msg-${msg.id}`} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div className="max-w-[80%] rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                    {contextLabel && (
                      <Link href={contextLabel.href} className="block text-xs text-zinc-400 hover:underline mb-1">{contextLabel.name}</Link>
                    )}
                    <p className="text-xs font-semibold text-red-700 mb-1">Registration Declined</p>
                    <p className="text-sm text-red-800">{msg.content}</p>
                    <p className="mt-1 text-right text-xs text-red-400">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            }

            // NORMAL message
            return (
              <div key={msg.id} id={`msg-${msg.id}`} className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
                {!isMine && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600 self-end">
                    {msg.sender?.name?.charAt(0) || "?"}
                  </div>
                )}
                <div className={cn("max-w-[75%]", isMine ? "items-end" : "items-start", "flex flex-col")}>
                  {!isMine && (
                    <p className="mb-0.5 text-xs font-semibold text-zinc-600">{msg.sender?.name}</p>
                  )}
                  {contextLabel && (
                    <Link href={contextLabel.href} className="text-xs text-zinc-400 hover:underline mb-0.5">{contextLabel.name}</Link>
                  )}
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    isMine ? "bg-red-600 text-white rounded-br-md" : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn("mt-1 text-right text-xs", isMine ? "text-red-200" : "text-zinc-400")}>
                      {formatTime(msg.createdAt)}
                      {msg.readAt && isMine && <span className="ml-1">✓✓</span>}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
