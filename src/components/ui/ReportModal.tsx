"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ReportModal({
  targetId,
  targetType,
  onClose,
}: {
  targetId: string;
  targetType: "USER" | "PROJECT";
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || sending) return;

    setSending(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, targetType, reason: reason.trim() }),
    });

    if (res.ok) setSent(true);
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {sent ? (
          <div className="text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
            <h3 className="mt-3 text-lg font-semibold text-zinc-900">Report submitted</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Our team will review this report. Thank you for keeping the community safe.
            </p>
            <button
              onClick={onClose}
              className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#1e40af]" />
                Report
              </h3>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Reason for reporting
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] resize-none"
                  placeholder="Please describe why you are reporting this..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reason.trim() || sending}
                  className="flex-1 rounded-full bg-[#1e40af] py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                >
                  {sending ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
