import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import type { Prisma } from "../../../generated/prisma/client";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`events-get:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || undefined;
  const eventType = url.searchParams.get("type") || undefined;
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;
  const locationScope = url.searchParams.get("scope") || undefined;
  const cursor = url.searchParams.get("cursor") || undefined;

  try {
    const where: Prisma.EventWhereInput = {};
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
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE_SIZE,
      include: {
        organizer: { select: { id: true, name: true } },
        _count: { select: { attendees: true } },
      },
      orderBy: { date: "asc" },
    });

    const nextCursor = events.length === PAGE_SIZE ? events[events.length - 1].id : null;
    return NextResponse.json({ events, nextCursor });
  } catch (error) {
    logger.error("List events error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`events-post:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { date, eventType, locationScope, maxAttendees, requireApproval, image }
      = body;

    const title = stripTags(String(body.title || "").trim()).slice(0, 200);
    const description = stripTags(String(body.description || "").trim()).slice(0, 2000);
    const location = stripTags(String(body.location || "").trim()).slice(0, 200);

    if (!title || !description || !date || !eventType || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
      return NextResponse.json({ error: "Date must be in the future" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: eventDate,
        location,
        eventType,
        image: image || null,
        locationScope: locationScope || null,
        maxAttendees: maxAttendees ?? null,
        requireApproval: Boolean(requireApproval),
        organizerId: session.user.id,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    logger.error("Create event error", { error: String(error) });
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
