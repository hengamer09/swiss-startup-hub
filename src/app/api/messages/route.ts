import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { APP_URL, stripTags } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE_SIZE,
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true, roles: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
        project: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                readAt: null,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const nextCursor = conversations.length === PAGE_SIZE ? conversations[conversations.length - 1].id : null;
    return NextResponse.json({ conversations, nextCursor });
  } catch (error) {
    logger.error("List conversations error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`message:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const senderId = session.user.id;

  try {
    const { receiverId, content, projectId } = await request.json();

    const trimmedContent = stripTags((content?.trim() || "")).slice(0, 5000);

    if (!receiverId || !trimmedContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let conversation;
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        projectId: projectId || null,
        participants: {
          every: {
            userId: { in: [senderId, receiverId] },
          },
        },
      },
    });

    if (existingConversation) {
      conversation = existingConversation;
    } else {
      conversation = await prisma.conversation.create({
        data: {
          projectId: projectId || null,
          participants: {
            create: [
              { userId: senderId },
              { userId: receiverId },
            ],
          },
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId,
        content: trimmedContent,
      },
    });

    const recipient = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, email: true },
    });

    if (recipient) {
      await prisma.notification.create({
        data: {
          userId: recipient.id,
          type: "message",
          content: `${session.user.name || "Someone"} sent you a message.`,
          link: "/messages",
        },
      });

      if (recipient.email) {
        sendEmail({
          to: recipient.email,
          subject: "New message on Swiss Startup Hub",
          text: `${session.user.name || "Someone"} sent you a private message:\n\n${trimmedContent}\n\nOpen your inbox: ${APP_URL}/messages`,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #18181b;"><p>Hi ${recipient.name || "there"},</p><p><strong>${session.user.name || "Someone"}</strong> sent you a private message.</p><p>${trimmedContent}</p><p><a href="${APP_URL}/messages" style="color:#dc2626;">Open your inbox</a></p></div>`,
        }).catch((err) => logger.error("Failed to send message email", { error: String(err) }));
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error("Send message error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
