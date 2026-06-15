"use client";

import { useState } from "react";
import { Download, Link as LinkIcon, Check } from "lucide-react";

// Generic QR + share card for a project or event (owner/organizer only).
export default function ShareCard({
  qrSrc,
  pageUrl,
  downloadName,
  label = "Scan to view this project",
}: {
  qrSrc: string;       // e.g. /api/projects/[id]/qr
  pageUrl: string;     // full public URL
  downloadName: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-[#0f172a]">Share</h2>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt="QR code"
          width={200}
          height={200}
          className="h-[200px] w-[200px] rounded-lg border border-[#e2e8f0]"
        />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-[#475569]">{label}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <a
              href={qrSrc}
              download={downloadName}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1e40af] px-4 py-2 text-xs font-medium text-white hover:bg-[#1d4ed8] transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Download QR Code
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <LinkIcon className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
