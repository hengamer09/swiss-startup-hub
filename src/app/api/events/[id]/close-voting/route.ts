import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Organizer only: freeze voting for an event.
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const event = await prisma.event.findUnique({ where: { id }, select: { organizerId: true } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (event.organizerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.event.update({ where: { id }, data: { votingClosed: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Close voting error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to close voting" }, { status: 500 });
  }
}
