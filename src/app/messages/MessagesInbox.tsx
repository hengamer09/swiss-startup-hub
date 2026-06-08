"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessagesInbox({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
    setLoading(false);
  }, []);

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
      return new Date(date).toLocaleDateString();
    } catch {
      return "";
    }
  };

  const getOtherParticipant = (conv: any) => {
    return conv.participants?.find((p: any) => p.userId !== userId)?.user;
  };

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
            className="mt-4 rounded-full bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Find People
          </Link>
        </div>
      ) : (
        <div className="flex-1 space-y-1">
          {conversations.map((conv: any) => {
            const other = getOtherParticipant(conv);
            const lastMessage = conv.messages?.[0];
            const unread = conv._count?.messages || 0;

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-4 py-4 transition-colors",
                  unread > 0
                    ? "bg-blue-50 hover:bg-blue-100"
                    : "hover:bg-zinc-50"
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
                  {other?.name?.charAt(0) || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        unread > 0
                          ? "font-semibold text-zinc-900"
                          : "font-medium text-zinc-700"
                      )}
                    >
                      {other?.name || "Unknown"}
                    </span>
                    {lastMessage && (
                      <span className="shrink-0 text-xs text-zinc-400">
                        {formatTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {conv.project && (
                    <span className="text-xs text-red-500 font-medium">
                      {conv.project.name}
                    </span>
                  )}
                  <p
                    className={cn(
                      "mt-0.5 truncate text-sm",
                      unread > 0 ? "font-medium text-zinc-800" : "text-zinc-500"
                    )}
                  >
                    {lastMessage
                      ? `${lastMessage.sender.name}: ${lastMessage.content}`
                      : "Start a conversation"}
                  </p>
                </div>
                {unread > 0 && (
                  <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {unread}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
