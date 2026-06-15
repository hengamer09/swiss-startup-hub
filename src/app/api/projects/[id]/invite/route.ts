import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { findOrCreateConversation, maybeSendMessageEmail } from "@/lib/messaging";
import { APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";

// Owner invites an interested person to apply — sends them a message.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`invite:${ip}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;

  try {
    const { userId: inviteeId } = await request.json();
    if (!inviteeId || typeof inviteeId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true, ownerId: true },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const projectUrl = `${APP_URL}/projects/${id}`;
    const conversationId = await findOrCreateConversation(prisma, session.user.id, inviteeId);
    await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        receiverId: inviteeId,
        content: `The founder of ${project.name} would like you to apply! View the project: ${projectUrl}`,
        type: "BOT_NOTIFICATION",
        projectId: id,
      },
    });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    maybeSendMessageEmail({
      conversationId,
      recipientId: inviteeId,
      senderId: session.user.id,
      subject: `You've been invited to apply to ${project.name} — Swiss Startup Hub`,
      previewText: `The founder of ${project.name} would like you to apply.`,
      context: project.name,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Invite to apply error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
