import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, organizerId: true },
    });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Approval status is derived from accept/decline messages tied to the event.
    const [totalRegistrations, approved, declined, messageCount] = await Promise.all([
      prisma.eventAttendee.count({ where: { eventId: id } }),
      prisma.message.count({ where: { eventId: id, type: "EVENT_ACCEPT" } }),
      prisma.message.count({ where: { eventId: id, type: "EVENT_DECLINE" } }),
      prisma.message.count({ where: { eventId: id } }),
    ]);

    const pending = Math.max(0, totalRegistrations - approved - declined);

    return NextResponse.json({ totalRegistrations, approved, pending, declined, messageCount });
  } catch (error) {
    logger.error("Event stats error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
