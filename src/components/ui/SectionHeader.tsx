import Link from "next/link";

/**
 * Swiss-editorial section header: a colour-ticked uppercase label sitting on a
 * hairline rule, with an optional "view all" action on the right. Replaces the
 * old emoji-prefixed headings so each feature area reads distinctly.
 */
export default function SectionHeader({
  label,
  tick = "bg-zinc-900",
  href,
  cta = "View all",
}: {
  label: string;
  /** Tailwind bg-* class for the accent tick (use a feature accent). */
  tick?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-200 pb-2.5">
      <span className={`h-3.5 w-1 shrink-0 ${tick}`} aria-hidden="true" />
      <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-zinc-900">
        {label}
      </h2>
      <span className="h-px flex-1 bg-zinc-100" aria-hidden="true" />
      {href && (
        <Link
          href={href}
          className="shrink-0 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          {cta} &rarr;
        </Link>
      )}
    </div>
  );
}
