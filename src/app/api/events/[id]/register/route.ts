import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const { message } = await request.json();
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
      },
    });
    if (!event) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const existing = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "You are already on the attendee list" },
        { status: 409 }
      );
    }

    if (event.maxAttendees) {
      const count = await prisma.eventAttendee.count({ where: { eventId: id } });
      if (count >= event.maxAttendees) {
        return NextResponse.json({ message: "Event full" }, { status: 400 });
      }
    }

    const attendee = await prisma.eventAttendee.create({
      data: {
        eventId: id,
        userId: session.user.id,
        intention: JSON.stringify({ message: message?.trim() || "" }),
      },
      include: {
        user: { select: { id: true, name: true, image: true, roles: true } },
      },
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

      if (event.organizer.email) {
        await sendEmail({
          to: event.organizer.email,
          subject: `New attendee for ${event.title}`,
          text: [
            `Hi ${event.organizer.name || "there"},`,
            "",
            `${session.user.name || "Someone"} joined the attendee list for ${event.title}.`,
            message?.trim() ? `Message: ${message.trim()}` : "Message: None provided",
            "",
            `Event link: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/events/${id}`,
          ].join("\n"),
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #18181b;"><p>Hi ${event.organizer.name || "there"},</p><p><strong>${session.user.name || "Someone"}</strong> joined the attendee list for <strong>${event.title}</strong>.</p><p><strong>Message:</strong> ${message?.trim() || "None provided"}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/events/${id}" style="color:#dc2626;">Open the event</a></p></div>`,
        });
      }
    }

    return NextResponse.json({ attendee }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ message: "Failed to register" }, { status: 500 });
  }
}
