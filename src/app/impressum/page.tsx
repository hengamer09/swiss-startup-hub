import Link from "next/link";
import { Mountain } from "lucide-react";

export const metadata = {
  title: "Impressum — Swiss Startup Hub",
};

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
          <Mountain className="h-4 w-4 text-[#1e40af]" aria-hidden="true" />
          Swiss Startup Hub
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-zinc-900">Impressum / Legal Notice</h1>
      <p className="mt-2 text-sm text-zinc-500">Stand / Last updated: 11 June 2026</p>

      <div className="mt-10 space-y-8 text-zinc-700">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Verantwortlich für den Inhalt</h2>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-5 leading-relaxed">
            <p className="font-medium text-zinc-900">Henri Stähli &amp; Johannes Pilhöfer</p>
            <p className="mt-1">Standort / Location: Aargau, Switzerland</p>
            <p className="mt-3">
              <span className="font-medium">E-Mail:</span>{" "}
              <a href="mailto:swissstartuphub@gmail.com" className="text-[#1e40af] hover:underline">
                swissstartuphub@gmail.com
              </a>
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            <strong className="text-zinc-700">Hinweis:</strong> Swiss Startup Hub ist derzeit ein
            Prototyp-Projekt. Eine Firmengründung ist in Planung. Dieses Impressum wird bei der
            Gründung entsprechend aktualisiert (Firmenname, Rechtsform, UID-Nummer).
          </p>
          <div className="mt-3 border-l-2 border-zinc-200 pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">English Translation</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              <strong className="text-zinc-700">Responsible for the content.</strong> Note: Swiss
              Startup Hub is currently a prototype project. A company formation is planned. This legal
              notice will be updated accordingly upon incorporation (company name, legal form, VAT/UID
              number).
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Haftungsausschluss</h2>
          <p className="mt-2 leading-relaxed">
            Die Inhalte dieser Website wurden mit grösstmöglicher Sorgfalt erstellt. Für die
            Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine
            Gewähr. Die Plattform vermittelt lediglich Kontakte zwischen Nutzern und ist nicht
            verantwortlich für Vereinbarungen, Investitionen oder Arbeitsverhältnisse, die zwischen
            Nutzern entstehen.
          </p>
          <p className="mt-2 leading-relaxed">
            Nutzer sind selbst dafür verantwortlich, vor dem Eingehen von geschäftlichen oder
            finanziellen Beziehungen die nötige Sorgfalt walten zu lassen.
          </p>
          <div className="mt-3 border-l-2 border-zinc-200 pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">English Translation</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              <strong className="text-zinc-700">Disclaimer.</strong> The contents of this website were
              created with the greatest possible care. However, we assume no liability for the
              accuracy, completeness or timeliness of the content. The platform merely facilitates
              contact between users and is not responsible for agreements, investments or employment
              relationships that arise between users. Users are themselves responsible for exercising
              the necessary due diligence before entering into any business or financial relationships.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Externe Links</h2>
          <p className="mt-2 leading-relaxed">
            Diese Website kann Links zu externen Websites enthalten. Für deren Inhalte sind
            ausschliesslich deren Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung wurden
            keine rechtswidrigen Inhalte festgestellt.
          </p>
          <div className="mt-3 border-l-2 border-zinc-200 pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">English Translation</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              <strong className="text-zinc-700">External Links.</strong> This website may contain links
              to external websites. Their operators are solely responsible for their content. No
              unlawful content was identified at the time the links were created.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Datenschutz</h2>
          <p className="mt-2 leading-relaxed">
            Informationen zum Datenschutz finden Sie in unserer{" "}
            <Link href="/privacy" className="text-[#1e40af] hover:underline">
              Datenschutzerklärung
            </Link>
            .
          </p>
          <div className="mt-3 border-l-2 border-zinc-200 pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">English Translation</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              <strong className="text-zinc-700">Data Protection.</strong> Information about data
              protection can be found in our{" "}
              <Link href="/privacy" className="text-[#1e40af] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Anwendbares Recht</h2>
          <p className="mt-2 leading-relaxed">
            Es gilt Schweizer Recht. Gerichtsstand ist der Kanton Aargau, Schweiz.
          </p>
          <div className="mt-3 border-l-2 border-zinc-200 pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">English Translation</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              <strong className="text-zinc-700">Applicable Law.</strong> Swiss law applies. The place
              of jurisdiction is the Canton of Aargau, Switzerland.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
