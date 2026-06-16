import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatStage } from "@/lib/utils";
import SectionHeader from "@/components/ui/SectionHeader";
import SchoolProjectBadge from "@/components/SchoolProjectBadge";
import WaitlistSection from "@/components/waitlist/WaitlistSection";

const VALUE_CARDS = [
  { emoji: "🚀", title: "Find Your Team", body: "Join active projects or start your own. Find co-founders and talented people.", href: "/feed" },
  { emoji: "🎯", title: "Get Mentorship", body: "Connect with experienced founders and professionals. They've been where you are.", href: "/mentors" },
  { emoji: "💡", title: "Grow Your Idea", body: "From school project to funded startup. Track progress, stay connected, build together.", href: "/projects/new" },
];

const STEPS = [
  { n: "01", title: "Create", body: "Publish your idea or startup in minutes." },
  { n: "02", title: "Find your team & mentors", body: "Bring on co-founders, talent and experienced guides." },
  { n: "03", title: "Scale", body: "Track momentum, raise, and grow into a real company." },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const [projects, userCount] = await Promise.all([
    prisma.project.findMany({
      take: 4,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        school: { select: { name: true } },
        _count: { select: { members: true, followers: true } },
      },
    }),
    prisma.user.count(),
  ]);

  const joinHref = session ? "/feed" : "/auth/signup";
  const startHref = session ? "/projects/new" : "/auth/signup";

  return (
    <div className="bg-white">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:pt-28">
        <div className="flex items-center gap-2">
          <span className="h-3 w-1 bg-[#1e40af]" aria-hidden="true" />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Small ideas, real companies
          </span>
        </div>
        <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
          Turn your idea into a <span className="text-[#1e40af]">company</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-500">
          Start in school, scale to market. Mentors, investors, and teams are waiting.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={joinHref} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e40af] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]">
            Join a Project <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href={startHref} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400">
            Start a Project <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {userCount > 0 && (
          <div className="mt-12 flex items-center gap-3 border-t border-zinc-200 pt-5">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-blue-100" />
              ))}
            </div>
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-900">{userCount}</span>{" "}
              {userCount === 1 ? "person" : "people"} building startups
            </p>
          </div>
        )}
      </section>

      {/* ── Three value cards ────────────────────────────────── */}
      <section className="border-y border-zinc-200 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-5 sm:grid-cols-3">
            {VALUE_CARDS.map((c) => (
              <Link key={c.title} href={c.href} className="group rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-lg">{c.emoji}</div>
                <h3 className="mt-4 flex items-center gap-1.5 font-semibold text-zinc-900">
                  {c.title}
                  <ArrowRight className="h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#1e40af]" />
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-zinc-500">{c.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured projects ────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <SectionHeader label="Featured Projects" tick="bg-blue-600" href="/search" />
        <p className="mt-3 text-sm text-zinc-500">Many started as school projects.</p>
        {projects.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">No projects are live yet. Be the first to publish one.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="group rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-base font-bold text-zinc-500">
                    {p.logo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.logo} alt={p.name} className="h-full w-full object-cover" />
                    ) : p.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-zinc-900 group-hover:text-[#1e40af]">{p.name}</h3>
                      <SchoolProjectBadge affiliation={p.schoolAffiliation} schoolName={p.school?.name} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{p.problem || "A new project waiting to be discovered."}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                      <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">{p.industry || "Startup"}</span>
                      <span>{formatStage(p.stage)}</span>
                      <span className="tabular-nums">{p._count.members} members</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="border-t border-zinc-200 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <SectionHeader label="How it works" />
          <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-white p-6">
                <span className="font-mono text-sm tabular-nums text-[#1e40af]">{s.n}</span>
                <h3 className="mt-2 font-semibold text-zinc-900">{s.title}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <WaitlistSection />

      {/* CTA — logged-out only */}
      {!session && (
        <section className="border-t border-zinc-200 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-1 bg-[#1e40af]" aria-hidden="true" />
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-zinc-500">Get started</span>
            </div>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Started your project in school? Keep building here.
            </h2>
            <p className="mt-3 max-w-md text-zinc-500">Sign up in under a minute and start connecting.</p>
            <Link href="/auth/signup" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#1e40af] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]">
              Create your profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
