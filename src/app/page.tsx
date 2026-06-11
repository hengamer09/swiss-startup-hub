import Link from "next/link";
import { ArrowRight, Users, Briefcase, Banknote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const projects = await prisma.project.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { members: true, followers: true },
      },
    },
  });
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Find your co-founder, team, or investor in{" "}
              <span className="text-red-600">Switzerland</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-500">
              The networking hub built exclusively for the Swiss startup ecosystem.
              Connect with founders, skilled professionals, and active investors —
              all in one place.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Join Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Explore Projects
              </Link>
            </div>
          </div>
        </div>

        {/* Role cards */}
        <div className="mx-auto max-w-7xl px-4 pb-16">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                <Rocket className="h-5 w-5 text-zinc-600" />
              </div>
              <h3 className="font-semibold text-zinc-900">Founders</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Find co-founders, team members, and funding
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                <Briefcase className="h-5 w-5 text-zinc-600" />
              </div>
              <h3 className="font-semibold text-zinc-900">Professionals</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Join exciting Swiss startups part-time or full-time
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                <Banknote className="h-5 w-5 text-zinc-600" />
              </div>
              <h3 className="font-semibold text-zinc-900">Investors</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Discover and back the next Swiss unicorn
              </p>
            </div>
          </div>
        </div>
      </section>

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
              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
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
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
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
