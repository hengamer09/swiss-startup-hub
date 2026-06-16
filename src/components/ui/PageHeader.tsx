import type { ReactNode } from "react";

/**
 * Editorial page header: a small colour-ticked kicker, a large headline on a
 * tight grid, optional subtitle and a right-aligned action. The trailing
 * hairline anchors the page to the Swiss grid.
 */
export default function PageHeader({
  kicker,
  title,
  subtitle,
  tick = "bg-zinc-900",
  action,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Tailwind bg-* class for the kicker tick (use a feature accent). */
  tick?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8">
      {kicker && (
        <div className="mb-3 flex items-center gap-2">
          <span className={`h-3 w-1 ${tick}`} aria-hidden="true" />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {kicker}
          </span>
        </div>
      )}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-6 h-px w-full bg-zinc-200" aria-hidden="true" />
    </div>
  );
}
