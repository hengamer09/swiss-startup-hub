import Link from "next/link";
import { Mountain, Mail } from "lucide-react";

export const metadata = {
  title: "Contact — Swiss Startup Hub",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
          <Mountain className="h-4 w-4 text-red-500" />
          Swiss Startup Hub
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-zinc-900">Contact</h1>
      <p className="mt-3 text-zinc-600 leading-relaxed">
        Have a question, a bug report, or partnership inquiry? We&apos;d love to hear from you.
      </p>

      <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 shrink-0">
            <Mail className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-900">Email us</h2>
            <p className="mt-1 text-sm text-zinc-500">
              For general inquiries, partnership proposals, and support.
            </p>
            <a
              href="mailto:hello@swissstartuphub.ch"
              className="mt-3 inline-block text-red-500 font-medium hover:underline"
            >
              hello@swissstartuphub.ch
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
        <p className="font-medium text-zinc-700 mb-1">Response time</p>
        <p>We typically respond within 1–2 business days.</p>
      </div>

      <p className="mt-8 text-sm text-zinc-500">
        You can also use the{" "}
        <span className="font-medium text-zinc-700">Feedback</span> button in the app
        to share product feedback or report issues directly — it goes straight to the team.
      </p>
    </div>
  );
}
