import Link from "next/link";
import { Mountain } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Swiss Startup Hub",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
          <Mountain className="h-4 w-4 text-[#1e40af]" aria-hidden="true" />
          Swiss Startup Hub
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-zinc-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: 11 June 2026</p>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">Responsible Party / Verantwortliche Stelle</p>
        <p className="mt-2">Henri Stähli &amp; Johannes Pilhöfer · Standort: Aargau, Schweiz</p>
        <p className="mt-1">
          <a href="mailto:swissstartuphub@gmail.com" className="text-[#1e40af] hover:underline">swissstartuphub@gmail.com</a>
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Note: Swiss Startup Hub is currently a prototype project. A company formation is planned.
          These documents will be updated accordingly once the company is registered (company name, legal form, UID number).
        </p>
      </div>

      <div className="mt-10 space-y-8 text-zinc-700">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">1. Acceptance</h2>
          <p className="mt-2 leading-relaxed">
            By creating an account or using Swiss Startup Hub (the &quot;Platform&quot;), you agree to
            these Terms of Service. If you do not agree, do not use the Platform. These terms are
            governed by Swiss law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">2. Eligibility</h2>
          <p className="mt-2 leading-relaxed">
            You must be at least 18 years old to use the Platform. Users may be based in Switzerland
            or internationally. By registering, you confirm that the information you provide is
            accurate and that you have the legal capacity to enter into these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">3. Your account</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>You are responsible for keeping your password confidential.</li>
            <li>
              You may not share your account with others or create accounts on behalf of third
              parties without their explicit consent.
            </li>
            <li>
              You must notify us immediately at{" "}
              <a href="mailto:swissstartuphub@gmail.com" className="text-[#1e40af] hover:underline">
                swissstartuphub@gmail.com
              </a>{" "}
              if you suspect unauthorised access to your account.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">4. Acceptable use</h2>
          <p className="mt-2 leading-relaxed">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>
              Post false, misleading, or fraudulent information about yourself, your projects, or
              your identity.
            </li>
            <li>Create fake profiles or impersonate other people or organisations.</li>
            <li>Harass, threaten, or abuse other users.</li>
            <li>Send unsolicited commercial messages (spam) or bulk outreach.</li>
            <li>Post illegal content, including content that infringes third-party intellectual property.</li>
            <li>
              Attempt to circumvent security measures, scrape the Platform at scale, or interfere
              with its operation.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">5. Accuracy of startup information</h2>
          <p className="mt-2 leading-relaxed">
            Swiss Startup Hub does not verify the accuracy, completeness, or legality of any
            startup, project, or profile information posted on the Platform. All content is
            user-generated. We make no representations or warranties regarding any startup, project,
            investment opportunity, or employment offer listed on the Platform.
          </p>
          <p className="mt-2 leading-relaxed">
            You are solely responsible for conducting your own due diligence before entering into
            any professional, commercial, or financial relationship with another user.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">6. No liability for deals or relationships</h2>
          <p className="mt-2 leading-relaxed">
            Swiss Startup Hub is a networking platform only. We are not a party to, and are not
            responsible for, any deals, investments, co-founder agreements, employment
            relationships, or other arrangements made between users through the Platform.
          </p>
          <p className="mt-2 leading-relaxed">
            Any investment decisions, employment agreements, or business partnerships are made
            entirely at your own risk. Swiss Startup Hub is not a licensed investment advisor,
            recruiter, or financial intermediary.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">7. Content ownership</h2>
          <p className="mt-2 leading-relaxed">
            You retain ownership of content you post on the Platform. By posting content, you grant
            Swiss Startup Hub a non-exclusive, worldwide, royalty-free licence to display, store,
            and distribute that content within the Platform for the purpose of operating the
            service. This licence ends when you delete the content or your account.
          </p>
          <p className="mt-2 leading-relaxed">
            We do not claim ownership of your projects, ideas, or intellectual property.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">8. Platform availability</h2>
          <p className="mt-2 leading-relaxed">
            We aim for high availability but do not guarantee uninterrupted access. The Platform is
            provided &quot;as is&quot;. We reserve the right to modify or discontinue features with
            reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">9. Limitation of liability</h2>
          <p className="mt-2 leading-relaxed">
            To the maximum extent permitted by Swiss law, Swiss Startup Hub is not liable for
            indirect, incidental, or consequential damages arising from your use of the Platform,
            including lost profits, lost data, or business interruption. Our total liability shall
            not exceed CHF 100 or the amount you paid us in the preceding 12 months, whichever is
            higher.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">10. Account suspension and termination</h2>
          <p className="mt-2 leading-relaxed">
            You may delete your account at any time via your profile settings. We may suspend or
            terminate accounts that violate these terms, with or without prior notice, depending on
            the severity of the violation. Repeated or serious violations (spam, fraud, harassment)
            may result in permanent bans.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">11. Governing law and jurisdiction</h2>
          <p className="mt-2 leading-relaxed">
            These terms are governed by Swiss law. Any disputes shall be subject to the exclusive
            jurisdiction of the courts of the Canton of Aargau, Switzerland.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">12. Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions about these terms? Contact us at{" "}
            <a href="mailto:swissstartuphub@gmail.com" className="text-[#1e40af] hover:underline">
              swissstartuphub@gmail.com
            </a>{" "}
            or visit our{" "}
            <Link href="/contact" className="text-[#1e40af] hover:underline">
              Contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
