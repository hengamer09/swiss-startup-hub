import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { findOrCreateConversation } from "@/lib/messaging";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const posts = await prisma.eventPost.findMany({
      where: { eventId: id },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json(posts);
  } catch (error) {
    logger.error("Get event posts error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

// Public chat: any authenticated user can post. This is intentional.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const content = stripTags(String(body.content || "").trim()).slice(0, 5000);

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        attendees: { select: { userId: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const post = await prisma.eventPost.create({
      data: {
        eventId: id,
        authorId: session.user.id,
        content,
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

    if (event.organizerId !== session.user.id) {
      const conversationId = await findOrCreateConversation(prisma, session.user.id, event.organizerId);
      const preview = content.slice(0, 80);
      await prisma.message.create({
        data: {
          conversationId,
          senderId: session.user.id,
          receiverId: event.organizerId,
          content: `\u{1F4AC} ${session.user.name || "Someone"} posted in ${event.title} discussion: "${preview}${content.length > 80 ? "…" : ""}" — View discussion`,
          type: "BOT_NOTIFICATION",
          eventId: event.id,
        },
      });
      await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error("Create event post error", { id, error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
