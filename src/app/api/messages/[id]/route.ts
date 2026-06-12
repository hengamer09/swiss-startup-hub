import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { maybeSendMessageEmail } from "@/lib/messaging";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id, participants: { some: { userId } } },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, image: true, roles: true } } },
        },
        project: { select: { id: true, name: true, ownerId: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, image: true } },
            project: { select: { id: true, name: true } },
            event: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Find any pending join requests between the two participants
    const other = conversation.participants.find((p) => p.userId !== userId);
    let joinRequest = null;
    if (other) {
      // Check if other person has a pending request for a project the current user owns
      joinRequest = await prisma.joinRequest.findFirst({
        where: {
          userId: other.userId,
          status: "PENDING",
          project: { ownerId: userId },
        },
        select: {
          id: true,
          status: true,
          motivation: true,
          applicantRole: true,
          links: true,
          userId: true,
          project: { select: { id: true, name: true, ownerId: true } },
        },
      });
      // Also check if current user has a pending request for a project the other person owns
      if (!joinRequest) {
        joinRequest = await prisma.joinRequest.findFirst({
          where: {
            userId,
            status: "PENDING",
            project: { ownerId: other.userId },
          },
          select: {
            id: true,
            status: true,
            motivation: true,
            applicantRole: true,
            links: true,
            userId: true,
            project: { select: { id: true, name: true, ownerId: true } },
          },
        });
      }
    }

    return NextResponse.json({ ...conversation, joinRequest });
  } catch (error) {
    logger.error("Get conversation error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}

// Post a message into an existing conversation (handles both 1:1 and group chats).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`message:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id: conversationId } = await params;
  const senderId = session.user.id;

  try {
    const { content } = await request.json();
    const trimmed = stripTags((content?.trim() || "")).slice(0, 5000);
    if (!trimmed) return NextResponse.json({ error: "Empty message" }, { status: 400 });

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, participants: { some: { userId: senderId } } },
      select: {
        id: true,
        isGroup: true,
        projectId: true,
        participants: { select: { userId: true } },
      },
    });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 1:1 chats carry an explicit receiver (drives unread + email); groups don't.
    const others = conversation.participants.map((p) => p.userId).filter((uid) => uid !== senderId);
    const receiverId = conversation.isGroup ? null : others[0] || null;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content: trimmed,
        projectId: conversation.projectId || null,
      },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    if (!conversation.isGroup && receiverId) {
      maybeSendMessageEmail({
        conversationId,
        recipientId: receiverId,
        senderId,
        subject: `New message from ${session.user.name || "Someone"} — Swiss Startup Hub`,
        previewText: trimmed,
      }).catch(() => {});
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error("Post conversation message error", { conversationId, error: String(error) });
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
