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
  const [joinRequest, setJoinRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [joinReply, setJoinReply] = useState("");
  const [joinProcessing, setJoinProcessing] = useState(false);
  const [joinError, setJoinError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/messages/${conversationId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      setParticipants(data.participants || []);
      setProject(data.project || null);
      setJoinRequest(data.joinRequest || null);
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

  const isFounderOfProject = joinRequest?.status === "PENDING" && joinRequest?.project?.ownerId === userId;

  async function handleJoinDecision(status: "APPROVED" | "REJECTED") {
    const reply = joinReply.trim();
    if (!reply) {
      setJoinError(status === "APPROVED" ? "Please enter a role title before accepting." : "Please enter a reason before declining.");
      return;
    }
    setJoinError("");
    setJoinProcessing(true);
    try {
      const res = await fetch(`/api/join-requests/${joinRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reply }),
      });
      if (res.ok) {
        setJoinRequest(null);
        setJoinReply("");
        await fetchMessages();
      } else {
        const data = await res.json().catch(() => ({}));
        setJoinError(data.error || "Something went wrong. Please try again.");
      }
    } finally {
      setJoinProcessing(false);
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

      {/* Join request banner — only for conversations with a pending join request */}
      {isFounderOfProject && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-amber-900">Join Request from {other?.name}</p>
            {joinRequest.applicantRole && (
              <p className="mt-1 text-xs text-amber-800"><span className="font-medium">Role:</span> {joinRequest.applicantRole}</p>
            )}
            {joinRequest.motivation && (
              <p className="mt-1 text-xs text-amber-800"><span className="font-medium">Message:</span> {joinRequest.motivation}</p>
            )}
            {joinRequest.links && (
              <p className="mt-1 text-xs text-amber-800">
                <span className="font-medium">Portfolio / Links:</span>{" "}
                <a href={joinRequest.links} target="_blank" rel="noopener noreferrer" className="underline">{joinRequest.links}</a>
              </p>
            )}
          </div>
          <div>
            <input
              type="text"
              value={joinReply}
              onChange={(e) => { setJoinReply(e.target.value); if (joinError) setJoinError(""); }}
              placeholder={`Role title (accept) or reason for declining — required`}
              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            {joinError && <p className="mt-1 text-xs text-red-600">{joinError}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleJoinDecision("APPROVED")} disabled={joinProcessing}
              className="flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
              <CheckCircle className="h-3.5 w-3.5" /> Accept
            </button>
            <button onClick={() => handleJoinDecision("REJECTED")} disabled={joinProcessing}
              className="flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 transition-colors">
              <XCircle className="h-3.5 w-3.5" /> Decline
            </button>
          </div>
        </div>
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

            // Context label
            const contextLabel = msg.project
              ? { href: `/projects/${msg.project.id}`, name: `via ${msg.project.name}` }
              : msg.event
              ? { href: `/events/${msg.event.id}`, name: `via ${msg.event.title}` }
              : null;

            if (type === "BOT_NOTIFICATION") {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 italic max-w-[85%] text-center">
                    {msg.content}
                  </div>
                </div>
              );
            }

            if (type === "JOIN_REQUEST") {
              const data = parsed || {};
              const hasResponse = messages.some(
                (m: any) => (m.type === "JOIN_ACCEPT" || m.type === "JOIN_DECLINE") && m.createdAt > msg.createdAt
              );
              const canAct = !isMine && data.projectOwnerId === userId && !hasResponse;
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <p className="text-sm font-semibold text-amber-900">Join Request from {msg.sender?.name}</p>
                    {data.projectName && <p className="text-xs text-amber-700">Project: {data.projectName}</p>}
                    {data.applicantRole && <p className="text-xs text-amber-800"><span className="font-medium">Role:</span> {data.applicantRole}</p>}
                    {data.motivation && <p className="text-xs text-amber-800"><span className="font-medium">Message:</span> {data.motivation}</p>}
                    {data.links && <p className="text-xs text-amber-800"><span className="font-medium">Portfolio:</span> <a href={data.links} target="_blank" rel="noopener noreferrer" className="underline">{data.links}</a></p>}
                    <p className="text-xs text-amber-600">{formatTime(msg.createdAt)}</p>
                    {canAct && !joinRequest && (
                      <div className="space-y-2 pt-1 border-t border-amber-200">
                        <input
                          type="text"
                          defaultValue={data.applicantRole || ""}
                          onChange={(e) => setJoinReply(e.target.value)}
                          placeholder="Role title (accept) or reason for declining"
                          className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleJoinDecision("APPROVED")} disabled={joinProcessing}
                            className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50">
                            <CheckCircle className="h-3 w-3" /> Accept
                          </button>
                          <button onClick={() => handleJoinDecision("REJECTED")} disabled={joinProcessing}
                            className="flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50">
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
                <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
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
                <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
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
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
                    <p className="text-sm font-semibold text-amber-900">Event Registration: {data.eventTitle || "Event"}</p>
                    <p className="text-xs text-amber-800">From: {data.attendeeName || msg.sender?.name}</p>
                    {data.attendeeMessage && <p className="text-xs text-amber-800">Message: {data.attendeeMessage}</p>}
                    <p className="text-xs text-amber-600">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            }

            // NORMAL message
            return (
              <div key={msg.id} className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
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
