import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSchoolType } from "@/lib/utils";
import { GraduationCap } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = { title: "Partner Schools — Swiss Startup Hub" };

export default async function SchoolsPage() {
  const schools = await prisma.school.findMany({
    where: { verified: true },
    orderBy: { name: "asc" },
    take: 200,
    select: {
      id: true, name: true, type: true, canton: true, city: true, logo: true,
      _count: { select: { students: true, projects: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        kicker="Schools"
        title="Partner Schools"
        subtitle="Schools and organizations bringing young entrepreneurs into the Swiss startup ecosystem."
        tick="bg-purple-600"
        action={
          <Link
            href="/schools/register"
            className="inline-flex rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-800"
          >
            Register your school
          </Link>
        }
      />

      {schools.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-16 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="text-sm text-zinc-500">No partner schools yet. Be the first to register one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((s) => (
            <Link
              key={s.id}
              href={`/schools/${s.id}`}
              className="group bg-white p-5 transition-colors hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-md bg-purple-50 text-base font-bold text-purple-700">
                  {s.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={s.logo} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    s.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-zinc-900 group-hover:text-purple-700">{s.name}</h2>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-purple-700">
                    {formatSchoolType(s.type)}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                {s.city}, {s.canton} · {s._count.students} students · {s._count.projects} projects
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
