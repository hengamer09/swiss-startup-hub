import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { APP_URL, stripTags } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { findOrCreateConversation, maybeSendMessageEmail } from "@/lib/messaging";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`register:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const message = body.message ? stripTags(String(body.message).trim()).slice(0, 1000) : "";

    const event = await prisma.event.findUnique({
      where: { id },
      include: { organizer: { select: { id: true, name: true, email: true } } },
    });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "You are already on the attendee list" }, { status: 409 });

    if (event.maxAttendees) {
      const count = await prisma.eventAttendee.count({ where: { eventId: id } });
      if (count >= event.maxAttendees) return NextResponse.json({ error: "Event full" }, { status: 400 });
    }

    const attendee = await prisma.eventAttendee.create({
      data: { eventId: id, userId: session.user.id, intention: JSON.stringify({ message }) },
      include: { user: { select: { id: true, name: true, image: true, roles: true } } },
    });

    if (event.organizerId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: event.organizerId,
          type: "event_registration",
          content: `${session.user.name || "Someone"} joined the attendee list for ${event.title}.`,
          link: `/events/${id}`,
        },
      });

      // Create EVENT_REGISTRATION message in the conversation
      const conversationId = await findOrCreateConversation(prisma, session.user.id, event.organizerId);
      const msgContent = JSON.stringify({
        eventId: event.id,
        eventTitle: event.title,
        attendeeName: session.user.name || "Someone",
        attendeeMessage: message,
      });
      await prisma.message.create({
        data: {
          conversationId,
          senderId: session.user.id,
          receiverId: event.organizerId,
          content: msgContent,
          type: "EVENT_REGISTRATION",
          eventId: event.id,
        },
      });
      await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

      maybeSendMessageEmail({
        conversationId,
        recipientId: event.organizerId,
        senderId: session.user.id,
        subject: `New registration from ${session.user.name || "Someone"} for ${event.title} — Swiss Startup Hub`,
        previewText: message || `${session.user.name || "Someone"} registered for ${event.title}`,
        context: event.title,
      }).catch(() => {});

      if (event.organizer.email) {
        sendEmail({
          to: event.organizer.email,
          subject: `New attendee for ${event.title}`,
          text: `${session.user.name || "Someone"} joined ${event.title}.\n\nMessage: ${message || "None"}\n\nEvent: ${APP_URL}/events/${id}`,
          html: `<div style="font-family:Arial,sans-serif"><p><strong>${session.user.name || "Someone"}</strong> joined ${event.title}.</p><p>Message: ${message || "None"}</p><p><a href="${APP_URL}/events/${id}" style="color:#dc2626;">Open event</a></p></div>`,
        }).catch((err) => logger.error("Event registration email failed", { error: String(err) }));
      }
    }

    return NextResponse.json({ attendee }, { status: 201 });
  } catch (error) {
    logger.error("Register error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
