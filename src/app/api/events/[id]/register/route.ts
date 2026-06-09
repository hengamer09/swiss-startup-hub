import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { regType, data } = body; // regType: 'idea'|'attendee'|'investor'

    if (!regType || !data) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ message: "Not found" }, { status: 404 });

    // Check capacity
    if (event.maxAttendees) {
      const count = await prisma.eventAttendee.count({ where: { eventId: id } });
      if (count >= event.maxAttendees) {
        return NextResponse.json({ message: "Event full" }, { status: 400 });
      }
    }

    // Determine approval logic
    let status = "PENDING";
    if (regType === "attendee" && !event.requireApproval) status = "APPROVED";
    // investor always pending

    const intention = JSON.stringify({ regType, status, data });

    const attendee = await prisma.eventAttendee.create({
      data: {
        eventId: id,
        userId: session.user.id,
        intention,
      },
    });

    // Notify organizer
    await prisma.notification.create({
      data: {
        userId: event.organizerId,
        type: "event_registration",
        content: `${session.user.name || "Someone"} registered for your event: ${event.title}`,
        link: `/events/${id}`,
      },
    });

    return NextResponse.json({ attendee, status }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ message: "Failed to register" }, { status: 500 });
  }
}
