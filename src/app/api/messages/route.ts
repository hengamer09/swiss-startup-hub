import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { findOrCreateConversation, maybeSendMessageEmail } from "@/lib/messaging";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE_SIZE,
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, image: true, roles: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
        project: { select: { id: true, name: true } },
        pins: { where: { userId }, select: { pinned: true } },
        _count: {
          select: { messages: { where: { receiverId: userId, readAt: null } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const nextCursor = conversations.length === PAGE_SIZE ? conversations[conversations.length - 1].id : null;
    return NextResponse.json({ conversations, nextCursor });
  } catch (error) {
    logger.error("List conversations error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`message:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const senderId = session.user.id;

  try {
    const { receiverId, content, projectId, eventId } = await request.json();
    const trimmedContent = stripTags((content?.trim() || "")).slice(0, 5000);

    if (!receiverId || !trimmedContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const conversationId = await findOrCreateConversation(prisma, senderId, receiverId);

    // Anti-duplicate: check if identical message in last 10 seconds
    const recent = await prisma.message.findFirst({
      where: {
        conversationId,
        senderId,
        content: trimmedContent,
        createdAt: { gte: new Date(Date.now() - 10_000) },
      },
    });
    if (recent) return NextResponse.json(recent, { status: 200 });

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content: trimmedContent,
        projectId: projectId || null,
        eventId: eventId || null,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    maybeSendMessageEmail({
      conversationId,
      recipientId: receiverId,
      senderId,
      subject: `New message from ${session.user.name || "Someone"} — Swiss Startup Hub`,
      previewText: trimmedContent,
    }).catch(() => {});

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error("Send message error", { error: String(error) });
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
