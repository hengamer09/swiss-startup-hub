"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Accept / decline state
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
      // Only update joinRequest if it is still pending (don't re-show after actioning)
      if (data.joinRequest?.status === "PENDING") {
        setJoinRequest(data.joinRequest);
      } else if (!joinRequest || joinRequest.status === "PENDING") {
        // Clear if it's been resolved
        setJoinRequest(data.joinRequest ?? null);
      }
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const isFounderOfProject =
    joinRequest?.status === "PENDING" &&
    joinRequest?.project?.ownerId === userId;

  async function handleJoinDecision(status: "APPROVED" | "REJECTED") {
    const reply = joinReply.trim();
    if (!reply) {
      setJoinError(
        status === "APPROVED"
          ? "Please enter a role title before accepting."
          : "Please enter a reason before declining."
      );
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

  const sendMessage = async () => {
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
  };

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
        <Link
          href="/messages"
          className="text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">
            {other?.name || "Unknown"}
          </h1>
          {project && (
            <Link
              href={`/projects/${project.id}`}
              className="text-xs text-red-500 hover:underline font-medium"
            >
              {project.name}
            </Link>
          )}
        </div>
      </div>

      {/* Join request banner — only visible to the project founder */}
      {isFounderOfProject && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Join Request from {other?.name}
            </p>
            {joinRequest.applicantRole && (
              <p className="mt-1 text-xs text-amber-800">
                <span className="font-medium">Role:</span>{" "}
                {joinRequest.applicantRole}
              </p>
            )}
            {joinRequest.motivation && (
              <p className="mt-1 text-xs text-amber-800">
                <span className="font-medium">Message:</span>{" "}
                {joinRequest.motivation}
              </p>
            )}
            {joinRequest.links && (
              <p className="mt-1 text-xs text-amber-800">
                <span className="font-medium">Portfolio / Links:</span>{" "}
                <a
                  href={joinRequest.links}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {joinRequest.links}
                </a>
              </p>
            )}
          </div>

          <div>
            <input
              type="text"
              value={joinReply}
              onChange={(e) => {
                setJoinReply(e.target.value);
                if (joinError) setJoinError("");
              }}
              placeholder="Role title (to accept) or reason for declining — required"
              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            {joinError && (
              <p className="mt-1 text-xs text-red-600">{joinError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleJoinDecision("APPROVED")}
              disabled={joinProcessing}
              className="flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              onClick={() => handleJoinDecision("REJECTED")}
              disabled={joinProcessing}
              className="flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-400">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          messages.map((msg: any) => {
            const isMine = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isMine ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    isMine
                      ? "bg-red-500 text-white rounded-br-md"
                      : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-right text-xs",
                      isMine ? "text-red-200" : "text-zinc-400"
                    )}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {msg.readAt && isMine && (
                      <span className="ml-1">✓✓</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2">
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
          className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
