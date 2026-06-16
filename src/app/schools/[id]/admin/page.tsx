import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatStage } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import AffiliationActions from "./AffiliationActions";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

export const metadata = { title: "School Admin — Swiss Startup Hub" };

export default async function SchoolAdminPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/auth/signin");

  const isPlatformAdmin = session?.user?.email === ADMIN_EMAIL;
  if (!isPlatformAdmin) {
    const membership = await prisma.schoolMembership.findFirst({
      where: { schoolId: id, userId, role: { in: ["ADMIN", "TEACHER"] } },
      select: { id: true },
    });
    if (!membership) notFound();
  }

  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      students: { include: { user: { select: { id: true, name: true } } } },
      projects: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, industry: true, stage: true, schoolAffiliation: true,
          owner: { select: { name: true } },
        },
      },
    },
  });
  if (!school) notFound();

  const pending = school.projects.filter((p) => p.schoolAffiliation === "PENDING");
  const approved = school.projects.filter((p) => p.schoolAffiliation === "APPROVED");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href={`/schools/${school.id}`} className="text-sm text-zinc-500 hover:text-zinc-900">← {school.name}</Link>
      <div className="mt-3">
        <PageHeader
          kicker="School Admin"
          title={school.name}
          subtitle={`${school.students.length} members · ${approved.length} approved projects · ${pending.length} pending`}
          tick="bg-purple-600"
        />
      </div>

      {/* Pending affiliations */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-900">Pending Project Affiliations</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-400">No pending requests.</p>
        ) : (
          <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link href={`/projects/${p.id}`} className="truncate font-medium text-zinc-900 hover:text-purple-700">{p.name}</Link>
                  <p className="text-xs text-zinc-400">{p.owner?.name} · {p.industry || "—"} · {formatStage(p.stage)}</p>
                </div>
                <AffiliationActions schoolId={school.id} projectId={p.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved projects */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-900">Approved Projects</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-zinc-400">No approved projects yet.</p>
        ) : (
          <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {approved.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-zinc-50">
                <div className="min-w-0">
                  <span className="truncate font-medium text-zinc-900">{p.name}</span>
                  <p className="text-xs text-zinc-400">{p.owner?.name} · {p.industry || "—"} · {formatStage(p.stage)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">✓ Approved</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Members */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-900">Members ({school.students.length})</h2>
        {school.students.length === 0 ? (
          <p className="text-sm text-zinc-400">No members yet.</p>
        ) : (
          <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {school.students.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3">
                <Link href={`/profile/${m.user?.id}`} className="text-sm font-medium text-zinc-900 hover:text-purple-700">{m.user?.name}</Link>
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
