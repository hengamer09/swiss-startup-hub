import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true } },
        attendees: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(event);
  } catch (error) {
    logger.error("Get event error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (event.organizerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { date, eventType, maxAttendees, requireApproval, locationScope } = body;

    const title = body.title ? stripTags(String(body.title).trim()).slice(0, 200) : undefined;
    const description = body.description ? stripTags(String(body.description).trim()).slice(0, 2000) : undefined;
    const location = body.location ? stripTags(String(body.location).trim()).slice(0, 200) : undefined;

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
        ...(location && { location }),
        ...(eventType && { eventType }),
        ...(maxAttendees !== undefined && { maxAttendees: maxAttendees ? Number(maxAttendees) : null }),
        ...(requireApproval !== undefined && { requireApproval }),
        ...(locationScope !== undefined && { locationScope: locationScope || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Event update error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (event.organizerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete event error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
