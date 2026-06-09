import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || undefined;
  const eventType = url.searchParams.get("type") || undefined;
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;
  const locationScope = url.searchParams.get("scope") || undefined;

  try {
    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    if (eventType) {
      where.eventType = eventType;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    } else {
      // default: only upcoming events
      where.date = { gte: new Date() };
    }
    if (locationScope === "Online") {
      where.location = { contains: "Online" };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true } },
        _count: { select: { attendees: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("List events error:", error);
    return NextResponse.json({ message: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, date, location, eventType, locationScope, maxAttendees, requireApproval, image }
      = body;

    if (!title || !description || !date || !eventType || !location) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
      return NextResponse.json({ message: "Date must be in the future" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        date: eventDate,
        location: location.trim(),
        eventType,
        image: image || null,
        locationScope: locationScope || null,
        maxAttendees: maxAttendees ?? null,
        requireApproval: Boolean(requireApproval),
        organizerId: session.user.id,
      },
    });

    // Optionally store settings in a lightweight JSON Notification or EventSettings table.

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ message: "Failed to create event" }, { status: 500 });
  }
}
