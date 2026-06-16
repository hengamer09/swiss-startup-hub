import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Authenticated: join a verified school as a STUDENT (idempotent).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const school = await prisma.school.findUnique({ where: { id }, select: { id: true, verified: true } });
    if (!school || !school.verified) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.schoolMembership.upsert({
      where: { schoolId_userId: { schoolId: id, userId: session.user.id } },
      update: {},
      create: { schoolId: id, userId: session.user.id, role: "STUDENT" },
    });
    await prisma.user.update({ where: { id: session.user.id }, data: { isStudent: true } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Join school error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to join school" }, { status: 500 });
  }
}
