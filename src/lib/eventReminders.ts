// Server-only — event reminder sender shared by the admin and cron routes.
// Handles two levels: 7 days before (±12h window) and 1 day before (next 24h).
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { eventReminderEmail } from "@/lib/emailTemplates";
import { findOrCreateConversation } from "@/lib/messaging";
import { APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function dateLabelFor(date: Date): string {
  return new Date(date).toLocaleString("en-CH", {
    weekday: "long", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export async function runEventReminders(): Promise<{
  sent: number;
  failed: number;
  events7d: number;
  events1d: number;
}> {
  const now = new Date();
  let sent = 0;
  let failed = 0;

  // --- 7 days before: events in exactly 7 days, ±12 hours ---
  const sevenDayStart = new Date(now.getTime() + 7 * DAY - 12 * HOUR);
  const sevenDayEnd = new Date(now.getTime() + 7 * DAY + 12 * HOUR);
  const events7d = await prisma.event.findMany({
    where: { date: { gte: sevenDayStart, lte: sevenDayEnd } },
    select: {
      id: true, title: true, date: true, location: true, description: true,
      attendees: {
        where: { reminder7dSent: false },
        select: { id: true, userId: true, user: { select: { email: true } } },
      },
    },
  });

  for (const event of events7d) {
    const dateLabel = dateLabelFor(event.date);
    const eventUrl = `${APP_URL}/events/${event.id}`;
    for (const attendee of event.attendees) {
      try {
        if (attendee.user?.email) {
          const { html, text } = eventReminderEmail(
            event.title, dateLabel, event.location, event.description || "", eventUrl,
            `Reminder: ${event.title} is in one week`
          );
          const ok = await sendEmail({
            to: attendee.user.email,
            subject: `Reminder: ${event.title} is in one week — Swiss Startup Hub`,
            text,
            html,
          });
          ok ? sent++ : failed++;
        }
        await prisma.eventAttendee.update({
          where: { id: attendee.id },
          data: { reminder7dSent: true },
        });
      } catch (err) {
        failed++;
        logger.error("7d reminder failed for attendee", { attendeeId: attendee.id, error: String(err) });
      }
    }
  }

  // --- 1 day before: events in the next 24 hours (never past) ---
  const in24h = new Date(now.getTime() + DAY);
  const events1d = await prisma.event.findMany({
    where: { date: { gte: now, lte: in24h } },
    select: {
      id: true, title: true, date: true, location: true, description: true, organizerId: true,
      attendees: {
        where: { reminder1dSent: false },
        select: { id: true, userId: true, user: { select: { email: true } } },
      },
    },
  });

  for (const event of events1d) {
    const dateLabel = dateLabelFor(event.date);
    const eventUrl = `${APP_URL}/events/${event.id}`;
    for (const attendee of event.attendees) {
      try {
        // In-app BOT_NOTIFICATION (skip if attendee is the organizer).
        if (attendee.userId !== event.organizerId) {
          const conversationId = await findOrCreateConversation(prisma, event.organizerId, attendee.userId);
          await prisma.message.create({
            data: {
              conversationId,
              senderId: event.organizerId,
              receiverId: attendee.userId,
              content: `⏰ Don't forget — ${event.title} is tomorrow (${dateLabel}) at ${event.location}. View: ${eventUrl}`,
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
            event.title, dateLabel, event.location, event.description || "", eventUrl,
            `Don't forget — ${event.title} is tomorrow!`
          );
          const ok = await sendEmail({
            to: attendee.user.email,
            subject: `Tomorrow: ${event.title} — Swiss Startup Hub`,
            text,
            html,
          });
          ok ? sent++ : failed++;
        }

        await prisma.eventAttendee.update({
          where: { id: attendee.id },
          data: { reminder1dSent: true },
        });
      } catch (err) {
        failed++;
        logger.error("1d reminder failed for attendee", { attendeeId: attendee.id, error: String(err) });
      }
    }
  }

  logger.info("Event reminders sent", { sent, failed, events7d: events7d.length, events1d: events1d.length });
  return { sent, failed, events7d: events7d.length, events1d: events1d.length };
}
