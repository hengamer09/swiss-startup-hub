import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { findOrCreateConversation } from "@/lib/messaging";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { attendeeId } = await request.json();
    if (!attendeeId) {
      return NextResponse.json({ error: "Missing attendee" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const attendee = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
    if (!attendee || attendee.eventId !== id) {
      return NextResponse.json({ error: "Attendee not found for this event" }, { status: 404 });
    }

    await prisma.eventAttendee.delete({
      where: { id: attendeeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Remove registration error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to remove attendee" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { registrantId, action, reason: rawReason, conversationId: convIdFromBody } = await request.json();

    if (!registrantId || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const reason = rawReason ? stripTags(String(rawReason).trim()).slice(0, 1000) : "";

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conversationId = convIdFromBody || await findOrCreateConversation(prisma, session.user.id, registrantId);
    const msgType = action === "ACCEPT" ? "EVENT_ACCEPT" : "EVENT_DECLINE";
    const msgContent = action === "ACCEPT"
      ? `Your registration for "${event.title}" has been confirmed! ${reason}`.trim()
      : `Your registration for "${event.title}" was declined. ${reason}`.trim();

    await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        receiverId: registrantId,
        content: msgContent,
        type: msgType,
        eventId: event.id,
      },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Event registration decision error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to process decision" }, { status: 500 });
  }
}
