import Link from "next/link";
import { ArrowRight, Users, Briefcase, Banknote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import WaitlistSection from "@/components/waitlist/WaitlistSection";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const [projects, userCount] = await Promise.all([
    prisma.project.findMany({
      take: 6,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { members: true, followers: true },
        },
      },
    }),
    prisma.user.count(),
  ]);
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl lg:text-6xl">
              Find your co-founder, team, or investor in{" "}
              <span className="text-[#1e40af]">Switzerland</span>
            </h1>
            <p className="mt-6 text-base leading-8 text-zinc-500 sm:text-lg">
              The networking hub built exclusively for the Swiss startup ecosystem.
              Connect with founders, skilled professionals, and active investors —
              all in one place.
            </p>
            {session && (
              <div className="mt-8 flex justify-center">
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1e40af] px-6 py-3 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
                >
                  Look at Projects
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            {!session && (
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1e40af] px-6 py-3 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
                >
                  Join for Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#1e40af] bg-white px-6 py-3 text-sm font-medium text-[#1e40af] hover:bg-blue-50 transition-colors"
                >
                  Explore Projects
                </Link>
              </div>
            )}

            {/* Social proof */}
            {userCount > 0 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full border-2 border-white bg-gradient-to-br from-blue-100 to-blue-200"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#94a3b8]">
                  <span className="font-semibold text-[#475569]">{userCount}</span>{" "}
                  {userCount === 1 ? "person has" : "people have"} joined
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Role cards */}
        <div className="mx-auto max-w-7xl px-4 pb-16">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 transition-all hover:border-[#3b82f6] hover:shadow-md">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Rocket className="h-5 w-5 text-[#1e40af]" />
              </div>
              <h3 className="font-semibold text-zinc-900">Founders</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Find co-founders, team members, and funding
              </p>
            </div>
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 transition-all hover:border-[#3b82f6] hover:shadow-md">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Briefcase className="h-5 w-5 text-[#1e40af]" />
              </div>
              <h3 className="font-semibold text-zinc-900">Professionals</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Join exciting Swiss startups part-time or full-time
              </p>
            </div>
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 transition-all hover:border-[#3b82f6] hover:shadow-md">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Banknote className="h-5 w-5 text-[#1e40af]" />
              </div>
              <h3 className="font-semibold text-zinc-900">Investors</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Discover and back the next Swiss unicorn
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Waitlist */}
      <WaitlistSection />

      {/* Active Projects */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">
                Active Projects
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Discover what&apos;s happening in the Swiss startup scene
              </p>
            </div>
            <Link
              href="/search"
              className="text-sm font-medium text-[#1e40af] hover:text-[#1e40af] transition-colors"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
                No projects are live yet. Be the first to publish one.
              </div>
            ) : (
              projects.map((project) => <ProjectCard key={project.id} project={project} />)
            )}
          </div>
        </div>
      </section>

      {/* CTA — logged-out only */}
      {!session && (
        <section className="border-t border-zinc-100 py-16">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-2xl font-semibold text-zinc-900">
              Ready to join the ecosystem?
            </h2>
            <p className="mt-3 text-zinc-500">
              Sign up in under a minute and start connecting.
            </p>
            <Link
              href="/auth/signup"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#1e40af] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
            >
              Create your profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-lg font-bold text-zinc-600 shrink-0">
          {project.logo ? (
            <img src={project.logo} alt={project.name} className="h-full w-full object-cover" />
          ) : (
            project.name.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 truncate">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {project.featured && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#1e40af]">
                ⭐ Featured
              </span>
            )}
            <span className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {project.industry || "Startup"}
            </span>
            <span className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {project.stage}
            </span>
            <span className="text-xs text-zinc-400">{project.location}</span>
          </div>
          <p className="mt-2 text-sm text-zinc-600 line-clamp-1">
            {project.problem || "A new project is waiting to be discovered."}
          </p>
          <p className="mt-0.5 text-sm text-zinc-500 line-clamp-1">
            {project.solution || "Visit the project page to learn more."}
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project._count.members} members
            </span>
            <span>{project._count.followers} followers</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Rocket(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}
