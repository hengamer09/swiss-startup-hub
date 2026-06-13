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
          <Mountain className="h-4 w-4 text-red-500" aria-hidden="true" />
          Swiss Startup Hub
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-zinc-900">Impressum</h1>
      <p className="mt-2 text-sm text-zinc-500">Stand: 11. Juni 2026</p>

      <div className="mt-10 space-y-8 text-zinc-700">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Verantwortlich für den Inhalt</h2>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-5 leading-relaxed">
            <p className="font-medium text-zinc-900">Henri Stähli &amp; Johannes Pilhöfer</p>
            <p className="mt-1">Standort: Aargau, Schweiz</p>
            <p className="mt-3">
              <span className="font-medium">E-Mail:</span>{" "}
              <a href="mailto:swissstartuphub@gmail.com" className="text-red-600 hover:underline">
                swissstartuphub@gmail.com
              </a>
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            <strong className="text-zinc-700">Hinweis:</strong> Swiss Startup Hub ist derzeit ein
            Prototyp-Projekt. Eine Firmengründung ist in Planung. Dieses Impressum wird bei der
            Gründung entsprechend aktualisiert (Firmenname, Rechtsform, UID-Nummer).
          </p>
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
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Externe Links</h2>
          <p className="mt-2 leading-relaxed">
            Diese Website kann Links zu externen Websites enthalten. Für deren Inhalte sind
            ausschliesslich deren Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung wurden
            keine rechtswidrigen Inhalte festgestellt.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Datenschutz</h2>
          <p className="mt-2 leading-relaxed">
            Informationen zum Datenschutz finden Sie in unserer{" "}
            <Link href="/privacy" className="text-red-600 hover:underline">
              Datenschutzerklärung
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Anwendbares Recht</h2>
          <p className="mt-2 leading-relaxed">
            Es gilt Schweizer Recht. Gerichtsstand ist der Kanton Aargau, Schweiz.
          </p>
        </section>
      </div>
    </div>
  );
}
