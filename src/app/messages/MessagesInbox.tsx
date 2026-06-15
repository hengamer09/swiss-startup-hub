"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Users, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function MessagesInbox({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // Local optimistic pin overrides: conversationId -> pinned boolean
  const [pinOverrides, setPinOverrides] = useState<Record<string, boolean>>({});

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data = await res.json();
      // Deduplicate 1:1 chats by other participant; always keep group chats.
      const seen = new Set<string>();
      const deduped = (data.conversations || []).filter((conv: any) => {
        if (conv.isGroup) return true;
        const other = conv.participants?.find((p: any) => p.userId !== userId)?.user;
        if (!other) return true;
        if (seen.has(other.id)) return false;
        seen.add(other.id);
        return true;
      });
      setConversations(deduped);
      setNextCursor(data.nextCursor ?? null);
    }
    setLoading(false);
  }, [userId]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await fetch(`/api/messages?cursor=${nextCursor}`);
    if (res.ok) {
      const data = await res.json();
      const seen = new Set<string>(
        conversations
          .map((conv: any) => {
            if (conv.isGroup) return "";
            const other = conv.participants?.find((p: any) => p.userId !== userId)?.user;
            return other?.id || "";
          })
          .filter(Boolean)
      );
      const deduped = (data.conversations || []).filter((conv: any) => {
        if (conv.isGroup) return true;
        const other = conv.participants?.find((p: any) => p.userId !== userId)?.user;
        if (!other) return true;
        if (seen.has(other.id)) return false;
        seen.add(other.id);
        return true;
      });
      setConversations((prev) => [...prev, ...deduped]);
      setNextCursor(data.nextCursor ?? null);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const formatTime = (date: string) => {
    try {
      const diff = Date.now() - new Date(date).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  };

  const getOtherParticipant = (conv: any) =>
    conv.participants?.find((p: any) => p.userId !== userId)?.user;

  const isPinned = (conv: any): boolean => {
    if (conv.id in pinOverrides) return pinOverrides[conv.id];
    if (conv.pins && conv.pins.length > 0) return conv.pins[0].pinned;
    return Boolean(conv.pinnedByDefault);
  };

  async function togglePin(e: React.MouseEvent, conv: any) {
    e.preventDefault();
    e.stopPropagation();
    const next = !isPinned(conv);
    setPinOverrides((prev) => ({ ...prev, [conv.id]: next }));
    try {
      await fetch(`/api/conversations/${conv.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: next }),
      });
    } catch {
      // revert on failure
      setPinOverrides((prev) => ({ ...prev, [conv.id]: !next }));
    }
  }

  const title = (conv: any) =>
    conv.isGroup
      ? conv.project?.name
        ? `${conv.project.name} — Team`
        : "Team chat"
      : getOtherParticipant(conv)?.name || "Unknown";

  // Build a clean preview line based on message type (sender name is shown separately).
  const previewText = (msg: any, conv: any): string => {
    if (!msg) return "Start a conversation";
    const type = msg.type || "NORMAL";
    let parsed: any = null;
    try {
      parsed = JSON.parse(msg.content);
    } catch {
      parsed = null;
    }
    switch (type) {
      case "BOT_NOTIFICATION":
        return `New activity in ${conv.project?.name || "your project"}`;
      case "JOIN_REQUEST":
        return `Join request${parsed?.applicantRole ? ` — ${parsed.applicantRole}` : ""}`;
      case "JOIN_ACCEPT":
        return "Request accepted ✓";
      case "JOIN_DECLINE":
        return "Request declined";
      case "EVENT_REGISTRATION":
        return "Event registration";
      default:
        return (msg.content || "").slice(0, 80);
    }
  };

  // Pinned conversations float to the top, preserving recency order within groups.
  const sorted = [...conversations].sort((a, b) => {
    const pa = isPinned(a) ? 1 : 0;
    const pb = isPinned(b) ? 1 : 0;
    return pb - pa;
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/" className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Messages</h1>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <Mail className="mb-3 h-10 w-10 text-zinc-300" />
          <h2 className="text-lg font-medium text-zinc-700">No messages yet</h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Send a message to a project founder or another member to get started.
          </p>
          <Link
            href="/search"
            className="mt-4 rounded-md bg-[#1e40af] px-5 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
          >
            Find People
          </Link>
        </div>
      ) : (
        <div className="flex-1 space-y-1">
          {sorted.map((conv: any) => {
            const lastMessage = conv.messages?.[0];
            const unread = conv._count?.messages || 0;
            const pinned = isPinned(conv);
            const isGroup = Boolean(conv.isGroup);

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={cn(
                  "group flex items-center gap-4 rounded-xl px-4 py-4 transition-colors",
                  unread > 0 ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-zinc-50"
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    isGroup ? "bg-blue-100 text-[#1e40af]" : "bg-zinc-100 text-zinc-600"
                  )}
                >
                  {isGroup ? <Users className="h-5 w-5" /> : title(conv).charAt(0) || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 truncate text-sm",
                        unread > 0 ? "font-semibold text-zinc-900" : "font-medium text-zinc-700"
                      )}
                    >
                      {pinned && <Pin className="h-3 w-3 shrink-0 text-amber-500" aria-label="Pinned" />}
                      {title(conv)}
                      {isGroup && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-[#1e40af]">
                          Group
                        </span>
                      )}
                    </span>
                    {lastMessage && (
                      <span className="shrink-0 text-xs text-zinc-400">
                        {formatTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 truncate text-sm",
                      unread > 0 ? "font-medium text-zinc-800" : "text-zinc-500"
                    )}
                  >
                    {previewText(lastMessage, conv)}
                  </p>
                </div>
                <button
                  onClick={(e) => togglePin(e, conv)}
                  aria-label={pinned ? "Unpin conversation" : "Pin conversation"}
                  title={pinned ? "Unpin" : "Pin to top"}
                  className="shrink-0 rounded-full p-1.5 text-zinc-300 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100"
                >
                  {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </button>
                {unread > 0 && (
                  <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1e40af] px-1.5 text-xs font-bold text-white">
                    {unread}
                  </div>
                )}
              </Link>
            );
          })}
          {nextCursor && (
            <div className="mt-4 flex justify-center pb-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
