import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Owner: manually close the fundraiser (no more pledges).
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const fundraiser = await prisma.fundraiser.findUnique({
      where: { projectId: id },
      select: { id: true, project: { select: { ownerId: true } } },
    });
    if (!fundraiser) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (fundraiser.project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.fundraiser.update({ where: { id: fundraiser.id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Close fundraiser error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to close fundraiser" }, { status: 500 });
  }
}
