import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { APP_URL } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
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
      take: 50,
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("List conversations error:", error);
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

  const senderId = session.user.id;

  try {
    const { receiverId, content, projectId } = await request.json();

    if (!receiverId || !content?.trim()) {
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
        content: content.trim(),
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
          text: `${session.user.name || "Someone"} sent you a private message:\n\n${content.trim()}\n\nOpen your inbox: ${APP_URL}/messages`,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #18181b;"><p>Hi ${recipient.name || "there"},</p><p><strong>${session.user.name || "Someone"}</strong> sent you a private message.</p><p>${content.trim()}</p><p><a href="${APP_URL}/messages" style="color:#dc2626;">Open your inbox</a></p></div>`,
        }).catch((err) => console.error("Failed to send message email:", err));
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
