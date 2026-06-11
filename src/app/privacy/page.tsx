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
          <Mountain className="h-4 w-4 text-red-500" aria-hidden="true" />
          Swiss Startup Hub
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-zinc-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: 11 June 2026</p>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">Responsible Party / Verantwortliche Stelle</p>
        <p className="mt-2">Henri Stähli &amp; Johannes Pilhöfer · Höhenweg 6 · 8966 Oberwil-Lieli · Switzerland</p>
        <p className="mt-1">
          <a href="mailto:henri@staehli.biz" className="text-red-600 hover:underline">henri@staehli.biz</a>
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Note: Swiss Startup Hub is currently a prototype project. A company formation is planned.
          These documents will be updated accordingly once the company is registered (company name, legal form, UID number).
        </p>
      </div>

      <div className="mt-10 space-y-8 text-zinc-700">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">1. Who we are</h2>
          <p className="mt-2 leading-relaxed">
            Swiss Startup Hub is an online platform connecting founders, professionals, and investors
            within the Swiss startup ecosystem. The platform is operated from Switzerland and is subject
            to the Swiss Federal Act on Data Protection (nDSG / revDSG) as well as, where applicable,
            the General Data Protection Regulation (GDPR) of the European Union.
          </p>
          <p className="mt-2 leading-relaxed">
            Data controller: Swiss Startup Hub, Switzerland. Contact:{" "}
            <a href="mailto:henri@staehli.biz" className="text-red-600 hover:underline">
              henri@staehli.biz
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">2. What personal data we collect</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              <strong>Account data:</strong> name, email address, and password (stored as a bcrypt
              hash — never in plain text).
            </li>
            <li>
              <strong>Profile information:</strong> bio, location, country, roles, skills, website and
              social media links, profile photo, and portfolio projects you choose to add.
            </li>
            <li>
              <strong>Activity data:</strong> projects you create or follow, join requests you send
              or receive, messages you exchange with other users, event registrations, and reviews.
            </li>
            <li>
              <strong>Technical data:</strong> IP address (used for rate limiting and security
              logging only), session tokens, and timestamps of key actions.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">3. Why we collect it and how it is used</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
            <li>To provide the platform and allow you to connect with other users.</li>
            <li>
              To send transactional emails (e.g. join request notifications, new messages) when
              relevant.
            </li>
            <li>To detect abuse, prevent fraud, and enforce our Terms of Service.</li>
            <li>To improve the platform based on aggregated, anonymised usage data.</li>
          </ul>
          <p className="mt-3 leading-relaxed font-medium text-zinc-800">
            We do not sell your personal data. We do not use your data for advertising or marketing
            profiling.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">4. Where your data is stored</h2>
          <p className="mt-2 leading-relaxed">
            Your data is stored on servers located in the EU and/or Switzerland. We use the following
            infrastructure providers, each bound by a data processing agreement:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>
              <strong>Vercel</strong> — application hosting (EU region where available).
            </li>
            <li>
              <strong>Neon / Supabase</strong> — PostgreSQL database (EU region).
            </li>
            <li>
              <strong>Vercel Blob</strong> — file and image storage.
            </li>
          </ul>
          <p className="mt-3 leading-relaxed">
            No personal data is transferred to countries outside the EU/EEA without adequate
            safeguards as required by the nDSG and GDPR.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">5. Who can see your data</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              <strong>Other users:</strong> your public profile (name, bio, roles, skills, and
              projects) is visible to all logged-in users. Your email address is never shown to other
              users.
            </li>
            <li>
              <strong>Messages:</strong> messages are only visible to the participants of a
              conversation.
            </li>
            <li>
              <strong>No third-party analytics or advertising networks</strong> have access to your
              data.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">6. How long we keep your data</h2>
          <p className="mt-2 leading-relaxed">
            We retain your data for as long as your account is active. If you delete your account,
            your personal data is permanently deleted immediately. We may retain certain data for
            longer where required by law (e.g. accounting records for 10 years under Swiss law), but
            such retention will be limited to the legally required minimum.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">7. Your rights (nDSG / GDPR)</h2>
          <p className="mt-2 leading-relaxed">
            You have the following rights regarding your personal data:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li><strong>Access:</strong> request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> correct inaccurate data directly in your profile settings or by contacting us.</li>
            <li><strong>Deletion:</strong> permanently delete your account and all associated data via the profile settings page, or by contacting us.</li>
            <li><strong>Portability:</strong> request your data in a structured, machine-readable format.</li>
            <li><strong>Objection / restriction:</strong> object to or request restriction of processing in certain circumstances.</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            To exercise any of these rights, email us at{" "}
            <a href="mailto:henri@staehli.biz" className="text-red-600 hover:underline">
              henri@staehli.biz
            </a>
            . We will respond within 30 days. If you believe your rights have not been respected,
            you may lodge a complaint with the Swiss Federal Data Protection and Information
            Commissioner (FDPIC) or, if based in the EU, with your national supervisory authority.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">8. Cookies</h2>
          <p className="mt-2 leading-relaxed">
            We use only strictly necessary cookies. Specifically, we set a single HTTP-only session
            cookie to keep you logged in (managed by NextAuth.js). This cookie is essential for the
            platform to function and does not require explicit consent under Swiss and EU law.
          </p>
          <p className="mt-2 leading-relaxed">
            We do not use tracking cookies, advertising cookies, or any third-party analytics
            cookies. No data is shared with advertising networks.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">9. Changes to this policy</h2>
          <p className="mt-2 leading-relaxed">
            We may update this policy from time to time. Material changes will be communicated by
            email or via an in-app notice. The date at the top of this page reflects the most recent
            revision.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">10. Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions or concerns about how we handle your data? Contact us at{" "}
            <a href="mailto:henri@staehli.biz" className="text-red-600 hover:underline">
              henri@staehli.biz
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
