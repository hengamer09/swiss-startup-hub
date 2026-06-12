import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { eventReminderEmail } from "@/lib/emailTemplates";
import { findOrCreateConversation } from "@/lib/messaging";
import { APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "henri@staehli.biz";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Events happening within the next 24 hours (never past events).
    const events = await prisma.event.findMany({
      where: { date: { gte: now, lte: in24h } },
      select: {
        id: true, title: true, date: true, location: true, description: true, organizerId: true,
        attendees: {
          where: { reminderSent: false },
          select: { id: true, userId: true, user: { select: { email: true } } },
        },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const event of events) {
      const dateLabel = new Date(event.date).toLocaleString("en-CH", {
        weekday: "long", day: "numeric", month: "short",
        hour: "2-digit", minute: "2-digit",
      });
      const eventUrl = `${APP_URL}/events/${event.id}`;

      for (const attendee of event.attendees) {
        try {
          // In-app BOT_NOTIFICATION message (skip if attendee is the organizer).
          if (attendee.userId !== event.organizerId) {
            const conversationId = await findOrCreateConversation(prisma, event.organizerId, attendee.userId);
            await prisma.message.create({
              data: {
                conversationId,
                senderId: event.organizerId,
                receiverId: attendee.userId,
                content: `⏰ Reminder: ${event.title} is happening soon (${dateLabel}) at ${event.location}. View: ${eventUrl}`,
                type: "BOT_NOTIFICATION",
                eventId: event.id,
              },
            });
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });
          }

          if (attendee.user?.email) {
            const { html, text } = eventReminderEmail(
              event.title, dateLabel, event.location, event.description || "", eventUrl
            );
            const ok = await sendEmail({
              to: attendee.user.email,
              subject: `Reminder: ${event.title} is tomorrow — Swiss Startup Hub`,
              text,
              html,
            });
            ok ? sent++ : failed++;
          }

          await prisma.eventAttendee.update({
            where: { id: attendee.id },
            data: { reminderSent: true },
          });
        } catch (err) {
          failed++;
          logger.error("Event reminder failed for attendee", { attendeeId: attendee.id, error: String(err) });
        }
      }
    }

    logger.info("Event reminders sent", { sent, failed, events: events.length });
    return NextResponse.json({ sent, failed, events: events.length });
  } catch (error) {
    logger.error("Event reminders error", { error: String(error) });
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
