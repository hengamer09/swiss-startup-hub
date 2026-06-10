import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const posts = await prisma.eventPost.findMany({
    where: { eventId: id },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { content } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ message: "Missing content" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      attendees: { select: { userId: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const post = await prisma.eventPost.create({
    data: {
      eventId: id,
      authorId: session.user.id,
      content: content.trim(),
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  const attendeeIds = event.attendees
    .map((attendee) => attendee.userId)
    .filter((userId, index, list) => userId !== session.user.id && list.indexOf(userId) === index);

  if (attendeeIds.length > 0) {
    await prisma.notification.createMany({
      data: attendeeIds.map((userId) => ({
        userId,
        type: "event_post",
        content: `${session.user.name || "Someone"} posted in ${event.title}.`,
        link: `/events/${id}`,
      })),
    });
  }

  return NextResponse.json(post, { status: 201 });
}
