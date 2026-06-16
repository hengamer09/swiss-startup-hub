import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatSchoolType } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import SchoolReviewActions from "./SchoolReviewActions";
import AffiliationActions from "@/app/schools/[id]/admin/AffiliationActions";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

export const metadata = { title: "Admin Settings — Swiss Startup Hub" };

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== ADMIN_EMAIL) notFound();

  const [pendingSchools, verifiedSchools, pendingAffiliations] = await Promise.all([
    prisma.school.findMany({
      where: { verified: false },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.school.findMany({
      where: { verified: true },
      orderBy: { name: "asc" },
      take: 300,
      include: { _count: { select: { students: true, projects: true } } },
    }),
    prisma.project.findMany({
      where: { schoolAffiliation: "PENDING", schoolId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, name: true, schoolId: true,
        owner: { select: { name: true } },
        school: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        kicker="Admin"
        title="Settings"
        subtitle="Manage schools and review project affiliations across the platform."
        tick="bg-zinc-900"
      />

      {/* Pending school registrations */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-900">
          Pending School Registrations ({pendingSchools.length})
        </h2>
        {pendingSchools.length === 0 ? (
          <p className="text-sm text-zinc-400">No pending registrations.</p>
        ) : (
          <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {pendingSchools.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">{s.name}</p>
                  <p className="text-xs text-zinc-400">
                    {formatSchoolType(s.type)} · {s.city}, {s.canton}
                    {s.contactEmail ? ` · ${s.contactEmail}` : ""}
                  </p>
                </div>
                <SchoolReviewActions schoolId={s.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending project affiliations (all schools) */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-900">
          Pending Project Affiliations ({pendingAffiliations.length})
        </h2>
        {pendingAffiliations.length === 0 ? (
          <p className="text-sm text-zinc-400">No pending affiliations.</p>
        ) : (
          <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {pendingAffiliations.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link href={`/projects/${p.id}`} className="truncate font-medium text-zinc-900 hover:text-[#1e40af]">{p.name}</Link>
                  <p className="text-xs text-zinc-400">{p.owner?.name} → {p.school?.name}</p>
                </div>
                {p.schoolId && <AffiliationActions schoolId={p.schoolId} projectId={p.id} />}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Verified schools */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-900">
          Verified Schools ({verifiedSchools.length})
        </h2>
        {verifiedSchools.length === 0 ? (
          <p className="text-sm text-zinc-400">No verified schools yet.</p>
        ) : (
          <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {verifiedSchools.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link href={`/schools/${s.id}`} className="truncate font-medium text-zinc-900 hover:text-purple-700">{s.name}</Link>
                  <p className="text-xs text-zinc-400">
                    {formatSchoolType(s.type)} · {s._count.students} members · {s._count.projects} projects
                  </p>
                </div>
                <Link href={`/schools/${s.id}/admin`} className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50">
                  Manage
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
