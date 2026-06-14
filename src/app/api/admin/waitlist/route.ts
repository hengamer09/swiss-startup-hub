import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/securityLog";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";
const ROLES = ["FOUNDER", "PROFESSIONAL", "INVESTOR"];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    logSecurityEvent("admin_unauthorized", { route: "waitlist", userId: session?.user?.id });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "";
  const search = (searchParams.get("search") || "").trim();

  try {
    const where: Record<string, unknown> = {};
    if (ROLES.includes(role)) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [entries, byRoleGroups] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.waitlistEntry.groupBy({ by: ["role"], _count: { _all: true } }),
    ]);

    const byRole: Record<string, number> = { FOUNDER: 0, PROFESSIONAL: 0, INVESTOR: 0 };
    for (const g of byRoleGroups) byRole[g.role] = g._count._all;
    const total = byRole.FOUNDER + byRole.PROFESSIONAL + byRole.INVESTOR;

    return NextResponse.json({ entries, total, byRole });
  } catch (error) {
    logger.error("Waitlist list error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load waitlist" }, { status: 500 });
  }
}
