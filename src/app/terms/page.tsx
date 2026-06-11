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
          <Mountain className="h-4 w-4 text-red-500" />
          Swiss Startup Hub
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-zinc-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: June 2026</p>

      <div className="mt-10 space-y-8 text-zinc-700">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">1. Acceptance</h2>
          <p className="mt-2 leading-relaxed">
            By creating an account or using Swiss Startup Hub (the "Platform"), you agree to these
            Terms of Service. If you do not agree, do not use the Platform. These terms are governed
            by Swiss law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">2. Eligibility</h2>
          <p className="mt-2 leading-relaxed">
            You must be at least 18 years old to use the Platform. By registering, you confirm that
            the information you provide is accurate and that you have the legal capacity to enter into
            these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">3. Your account</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>You are responsible for keeping your password confidential.</li>
            <li>You may not share your account with others or create accounts on behalf of third parties without their consent.</li>
            <li>You must notify us immediately if you suspect unauthorised access to your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">4. Acceptable use</h2>
          <p className="mt-2 leading-relaxed">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>Post false, misleading, or fraudulent information about yourself or your projects.</li>
            <li>Harass, threaten, or abuse other users.</li>
            <li>Send unsolicited commercial messages (spam).</li>
            <li>Attempt to circumvent security measures, scrape the Platform at scale, or interfere with its operation.</li>
            <li>Post content that infringes third-party intellectual property rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">5. Content ownership</h2>
          <p className="mt-2 leading-relaxed">
            You retain ownership of content you post. By posting it, you grant Swiss Startup Hub a
            non-exclusive, worldwide, royalty-free licence to display and distribute that content
            within the Platform for the purpose of operating the service. We do not claim ownership
            of your projects or ideas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">6. Platform availability</h2>
          <p className="mt-2 leading-relaxed">
            We aim for high availability but do not guarantee uninterrupted access. The Platform is
            provided "as is". We reserve the right to modify or discontinue features with reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">7. Limitation of liability</h2>
          <p className="mt-2 leading-relaxed">
            To the maximum extent permitted by Swiss law, Swiss Startup Hub is not liable for indirect,
            incidental, or consequential damages arising from your use of the Platform, including lost
            profits, lost data, or business interruption. Our total liability shall not exceed CHF 100
            or the amount you paid us in the preceding 12 months, whichever is higher.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">8. Termination</h2>
          <p className="mt-2 leading-relaxed">
            You may delete your account at any time. We may suspend or terminate accounts that violate
            these terms, with or without prior notice, depending on the severity of the violation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">9. Governing law and disputes</h2>
          <p className="mt-2 leading-relaxed">
            These terms are governed by Swiss law. Any disputes shall be subject to the exclusive
            jurisdiction of the courts of Switzerland.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">10. Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions about these terms?{" "}
            <Link href="/contact" className="text-red-500 hover:underline">
              Contact us
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
