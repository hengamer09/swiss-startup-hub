import Link from "next/link";
import { Mountain } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Swiss Startup Hub",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
          <Mountain className="h-4 w-4 text-red-500" />
          Swiss Startup Hub
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-zinc-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: June 2026</p>

      <div className="mt-10 space-y-8 text-zinc-700">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">1. Who we are</h2>
          <p className="mt-2 leading-relaxed">
            Swiss Startup Hub is an online platform connecting founders, professionals, and investors
            within the Swiss startup ecosystem. The platform is operated from Switzerland and is subject
            to the Swiss Federal Act on Data Protection (nDSG / revDSG) as well as, where applicable,
            the General Data Protection Regulation (GDPR) of the European Union.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">2. What data we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li><strong>Account data:</strong> name, email address, password (stored as a bcrypt hash — never in plain text), role, and profile details you provide (bio, location, links, skills).</li>
            <li><strong>Usage data:</strong> pages visited, actions taken (following projects, sending messages, registering for events), and timestamps.</li>
            <li><strong>Technical data:</strong> IP address (used for rate limiting and security logging), browser type, and session tokens.</li>
            <li><strong>Content you create:</strong> project descriptions, posts, messages, reviews, and event registrations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">3. Why we collect it</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>To provide the platform and enable you to connect with other users.</li>
            <li>To send transactional emails (e.g. join request approvals, new messages) when you have enabled notifications.</li>
            <li>To detect abuse, prevent fraud, and enforce our Terms of Service.</li>
            <li>To improve the platform based on aggregated, anonymised usage patterns.</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            We do not sell your personal data. We do not use your data for advertising profiling.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">4. Who has access to your data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li><strong>Other users:</strong> your public profile (name, bio, role, skills, projects) is visible to all logged-in users. Your email address is never shown to other users.</li>
            <li><strong>Service providers:</strong> we use Vercel (hosting, EU/US), Neon/Supabase (PostgreSQL database, EU region), and Vercel Blob (file storage). These processors are bound by data processing agreements.</li>
            <li><strong>No third-party analytics or ad networks.</strong></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">5. How long we keep it</h2>
          <p className="mt-2 leading-relaxed">
            We retain your data for as long as your account is active. If you delete your account,
            your personal data is deleted within 30 days, except where we are required to retain it
            by law (e.g. accounting records for 10 years under Swiss law).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">6. Your rights</h2>
          <p className="mt-2 leading-relaxed">
            Under the nDSG (and GDPR if applicable) you have the right to access, correct, port, and
            delete your personal data. You may also object to processing or request restriction.
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:hello@swissstartuphub.ch" className="text-red-500 hover:underline">
              hello@swissstartuphub.ch
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">7. Cookies and session storage</h2>
          <p className="mt-2 leading-relaxed">
            We use a single, HTTP-only session cookie for authentication (NextAuth.js). No third-party
            tracking cookies are set. No consent banner is required beyond this notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">8. Changes to this policy</h2>
          <p className="mt-2 leading-relaxed">
            We may update this policy from time to time. Material changes will be communicated by
            email or via an in-app notice. The date at the top of this page reflects the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">9. Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions or complaints? Reach us at{" "}
            <a href="mailto:hello@swissstartuphub.ch" className="text-red-500 hover:underline">
              hello@swissstartuphub.ch
            </a>
            . If you are based in the EU and feel your rights have not been respected, you may lodge a
            complaint with your national supervisory authority.
          </p>
        </section>
      </div>
    </div>
  );
}
