"use client";

import { useEffect, useState } from "react";
import { Send, Eye, X, Loader2, Megaphone } from "lucide-react";
import { newsletterEmail } from "@/lib/emailTemplates";
import { newsletterTextToHtml } from "@/lib/newsletterFormat";
import { APP_URL } from "@/lib/utils";

export default function NewsletterAdmin() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/subscriber-count");
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    })();
  }, []);

  const previewHtml = newsletterEmail(
    subject || "(no subject)",
    newsletterTextToHtml(content || "_Your newsletter content will appear here._"),
    `${APP_URL}/unsubscribe?token=preview`
  ).html;

  function openConfirm() {
    setError("");
    setResult("");
    if (!subject.trim() || !content.trim()) {
      setError("Subject and content are both required.");
      return;
    }
    setConfirmOpen(true);
  }

  async function send() {
    setConfirmOpen(false);
    setSending(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send newsletter.");
      } else {
        setResult(`Sent to ${data.sent} subscribers. ${data.failed} failed.`);
        setSubject("");
        setContent("");
      }
    } catch {
      setError("Failed to send newsletter.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Megaphone className="h-4 w-4 text-red-500" />
        Send Newsletter
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500">
        {count === null ? "Loading subscriber count…" : `${count} subscriber${count === 1 ? "" : "s"}`}
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's new at Swiss Startup Hub"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700">Body</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder={"# A heading\n\nA normal paragraph of text.\n\n- A bullet point\n- Another bullet point"}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Formatting: <code># </code> for headings, <code>- </code> for bullets, blank lines separate paragraphs.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && <p className="text-sm text-green-600">{result}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Eye className="h-4 w-4" /> Preview
          </button>
          <button
            onClick={openConfirm}
            disabled={sending}
            className="flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending…" : "Send to all subscribers"}
          </button>
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">Email preview</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe
              title="Newsletter preview"
              srcDoc={previewHtml}
              sandbox=""
              className="h-[60vh] w-full rounded-b-xl"
            />
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center">
            <h3 className="text-lg font-semibold text-zinc-900">Send newsletter?</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Are you sure? This will send an email to{" "}
              <strong>{count ?? 0}</strong> subscriber{count === 1 ? "" : "s"}.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={send}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Send now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
