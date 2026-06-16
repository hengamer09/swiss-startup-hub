import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatSchoolType, formatStage } from "@/lib/utils";
import { FEATURES } from "@/lib/features";
import SectionHeader from "@/components/ui/SectionHeader";
import WaitlistSection from "@/components/waitlist/WaitlistSection";

// What you can actually do here — laid out as a labelled index so each feature
// reads as its own thing instead of an identical card.
const FEATURE_INDEX: { key: keyof typeof FEATURES; desc: string }[] = [
  { key: "projects", desc: "Browse Swiss startups, join a team, or launch your own." },
  { key: "schools", desc: "Universities and the student founders building from them." },
  { key: "mentors", desc: "Experienced founders and operators, available to help." },
  { key: "events", desc: "Meetups, demo days and live pitch competitions." },
  { key: "funding", desc: "Back early projects raising their first round." },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const [projects, userCount, partnerSchools, studentProjects, mentors] = await Promise.all([
    prisma.project.findMany({
      take: 6,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { members: true, followers: true } } },
    }),
    prisma.user.count(),
    prisma.school.findMany({
      where: { verified: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, canton: true, logo: true, _count: { select: { students: true } } },
    }),
    prisma.project.findMany({
      where: { isStudentProject: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, industry: true, stage: true, school: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { availableForMentoring: true, roles: { contains: "MENTOR" } },
      take: 4,
      orderBy: { averageRating: "desc" },
      select: { id: true, name: true, image: true, mentoringStyle: true },
    }),
  ]);

  return (
    <div className="bg-white">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:pt-28">
        <div className="flex items-center gap-2">
          <span className="h-3 w-1 bg-[#1e40af]" aria-hidden="true" />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Switzerland&apos;s startup network
          </span>
        </div>
        <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
          Find your co-founder, team, or investor in{" "}
          <span className="text-[#1e40af]">Switzerland</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-500">
          One place for the Swiss startup ecosystem — founders, talent, schools,
          mentors and capital. No noise, no algorithm. Just the people building.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {session ? (
            <Link href="/feed" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e40af] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]">
              Go to the feed <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e40af] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]">
                Join for free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/search" className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400">
                Explore projects
              </Link>
            </>
          )}
        </div>

        {/* Stat strip on a hairline */}
        {userCount > 0 && (
          <div className="mt-12 flex items-center gap-3 border-t border-zinc-200 pt-5">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-blue-100" />
              ))}
            </div>
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-900">{userCount}</span>{" "}
              {userCount === 1 ? "person has" : "people have"} joined the ecosystem
            </p>
          </div>
        )}
      </section>

      {/* ── Feature index ────────────────────────────────────── */}
      <section className="border-y border-zinc-200 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeader label="Everything in one place" />
          <div className="mt-6 grid gap-x-10 gap-y-px sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_INDEX.map(({ key, desc }) => {
              const f = FEATURES[key];
              return (
                <Link
                  key={key}
                  href={f.href}
                  className="group flex items-start gap-3 border-b border-zinc-200 py-5 transition-colors hover:border-zinc-400"
                >
                  <span className={`mt-1 h-8 w-1 shrink-0 ${f.tick}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900">{f.label}</h3>
                      <ArrowRight className="h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-600" />
                    </div>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">{desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Curated rows ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl space-y-14 px-4 py-16">
        {partnerSchools.length > 0 && (
          <div>
            <SectionHeader label="Partner Schools" tick={FEATURES.schools.tick} href="/schools" />
            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-4">
              {partnerSchools.map((s) => (
                <Link key={s.id} href={`/schools/${s.id}`} className="group bg-white p-4 transition-colors hover:bg-zinc-50">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-purple-50 text-sm font-bold text-purple-700">
                    {s.logo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={s.logo} alt={s.name} className="h-full w-full object-cover" />
                    ) : s.name.charAt(0)}
                  </div>
                  <p className="mt-2.5 truncate text-sm font-semibold text-zinc-900 group-hover:text-purple-700">{s.name}</p>
                  <p className="text-xs text-zinc-400">{formatSchoolType(s.type)} · {s.canton}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {studentProjects.length > 0 && (
          <div>
            <SectionHeader label="Student Projects" tick={FEATURES.schools.tick} href="/feed?student=true" />
            <div className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
              {studentProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="group bg-white p-4 transition-colors hover:bg-zinc-50">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-purple-700">🎓 Student</span>
                  <p className="mt-1.5 truncate text-sm font-semibold text-zinc-900 group-hover:text-purple-700">{p.name}</p>
                  {p.school?.name && <p className="truncate text-xs text-purple-700">{p.school.name}</p>}
                  <p className="text-xs text-zinc-400">{p.industry || "—"} · {formatStage(p.stage)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {mentors.length > 0 && (
          <div>
            <SectionHeader label="Featured Mentors" tick={FEATURES.mentors.tick} href="/mentors" cta="Find a mentor" />
            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-4">
              {mentors.map((m) => (
                <Link key={m.id} href={`/profile/${m.id}`} className="group flex flex-col items-center bg-white p-4 text-center transition-colors hover:bg-zinc-50">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-teal-50 text-base font-bold text-teal-700">
                    {m.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
                    ) : m.name?.charAt(0) || "M"}
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-zinc-900 group-hover:text-teal-700">{m.name}</p>
                  {m.mentoringStyle && <p className="truncate text-xs text-zinc-400">{m.mentoringStyle}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Active projects — numbered editorial list */}
        <div>
          <SectionHeader label="Active Projects" tick={FEATURES.projects.tick} href="/search" />
          <div className="mt-2">
            {projects.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">No projects are live yet. Be the first to publish one.</p>
            ) : (
              projects.map((project, i) => <ProjectRow key={project.id} project={project} n={i + 1} />)
            )}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <WaitlistSection />

      {/* CTA — logged-out only */}
      {!session && (
        <section className="border-t border-zinc-200 bg-[#f8fafc] py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-1 bg-[#1e40af]" aria-hidden="true" />
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-zinc-500">Get started</span>
            </div>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Ready to join the ecosystem?
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function ProjectRow({ project, n }: { project: any; n: number }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group -mx-2 flex items-center gap-4 border-b border-zinc-100 px-2 py-4 transition-colors hover:bg-zinc-50"
    >
      <span className="w-7 shrink-0 font-mono text-sm tabular-nums text-zinc-300 group-hover:text-[#1e40af]">
        {String(n).padStart(2, "0")}
      </span>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-base font-bold text-zinc-500">
        {project.logo ? (
          <img src={project.logo} alt={project.name} className="h-full w-full object-cover" />
        ) : project.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-zinc-900 group-hover:text-[#1e40af]">{project.name}</h3>
          {project.featured && (
            <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider text-[#1e40af]">★ Featured</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-500">
          {project.problem || "A new project waiting to be discovered."}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-4 text-xs text-zinc-400 sm:flex">
        <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">{project.industry || "Startup"}</span>
        <span>{project.stage}</span>
        <span className="tabular-nums">{project._count.members} members</span>
      </div>
    </Link>
  );
}
