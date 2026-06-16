import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatSchoolType, formatStage } from "@/lib/utils";
import JoinSchoolButton from "./JoinSchoolButton";

export default async function SchoolDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id || null;

  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      students: {
        take: 100,
        include: {
          user: { select: { id: true, name: true, image: true, skills: { include: { skill: true }, take: 4 } } },
        },
      },
      projects: {
        take: 50,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, industry: true, stage: true },
      },
    },
  });

  if (!school || !school.verified) notFound();

  const isMember = userId ? school.students.some((m) => m.userId === userId) : false;
  const myRole = userId ? school.students.find((m) => m.userId === userId)?.role : null;
  const canManage = myRole === "TEACHER" || myRole === "ADMIN";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/schools" className="text-sm text-[#475569] hover:text-[#0f172a]">← All schools</Link>

      <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-purple-50 text-xl font-bold text-purple-700">
              {school.logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={school.logo} alt={school.name} className="h-full w-full object-cover" />
              ) : (
                school.name.charAt(0)
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#0f172a]">{school.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#94a3b8]">
                <span className="rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">{formatSchoolType(school.type)}</span>
                <span>{school.city}, {school.canton}</span>
                {school.website && (
                  <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-[#1e40af] hover:underline">Website</a>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0">
            {canManage ? (
              <span className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-medium text-[#475569]">Manage School</span>
            ) : userId && !isMember ? (
              <JoinSchoolButton schoolId={school.id} />
            ) : isMember ? (
              <span className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700">Member ✓</span>
            ) : null}
          </div>
        </div>

        {school.description && <p className="mt-4 text-sm leading-relaxed text-[#475569]">{school.description}</p>}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[#0f172a]">Students &amp; Members ({school.students.length})</h2>
          {school.students.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">No members yet.</p>
          ) : (
            <div className="space-y-2">
              {school.students.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                    {m.user?.name?.charAt(0) || "U"}
                  </div>
                  <Link href={`/profile/${m.user?.id}`} className="text-sm font-medium text-[#0f172a] hover:text-[#1e40af]">
                    {m.user?.name}
                  </Link>
                  <span className="ml-auto rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-[#0f172a]">Projects ({school.projects.length})</h2>
          {school.projects.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {school.projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 hover:shadow-sm">
                  <p className="text-sm font-medium text-[#0f172a]">{p.name}</p>
                  <p className="text-xs text-[#94a3b8]">{p.industry || "—"} · {formatStage(p.stage)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
