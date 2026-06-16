import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSchoolType } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

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
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#0f172a]">🏫 Partner Schools</h1>
          <p className="mt-1 text-sm text-[#475569]">
            Schools and organizations bringing young entrepreneurs to the Swiss startup ecosystem.
          </p>
        </div>
        <Link
          href="/schools/register"
          className="rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
        >
          Register your school
        </Link>
      </div>

      {schools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e2e8f0] bg-white py-16 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="text-sm text-[#475569]">No partner schools yet. Be the first to register one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((s) => (
            <Link
              key={s.id}
              href={`/schools/${s.id}`}
              className="rounded-xl border border-[#e2e8f0] bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-purple-50 text-base font-bold text-purple-700">
                  {s.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={s.logo} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    s.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-[#0f172a]">{s.name}</h2>
                  <span className="inline-flex rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                    {formatSchoolType(s.type)}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#94a3b8]">
                {s.city}, {s.canton} · {s._count.students} students · {s._count.projects} projects
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
