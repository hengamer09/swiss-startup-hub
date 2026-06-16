import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/securityLog";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

// Admin: list all schools (pending + verified) with counts.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    logSecurityEvent("admin_unauthorized", { route: "admin/schools", userId: session?.user?.id });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const schools = await prisma.school.findMany({
      orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
      take: 300,
      include: { _count: { select: { students: true, projects: true } } },
    });
    return NextResponse.json({ schools });
  } catch (error) {
    logger.error("Admin list schools error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load schools" }, { status: 500 });
  }
}
