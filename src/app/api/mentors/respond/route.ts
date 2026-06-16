import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { APP_URL } from "@/lib/utils";
import { findOrCreateConversation, maybeSendMessageEmail } from "@/lib/messaging";
import { logger } from "@/lib/logger";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mentor accepts/declines a mentorship request message.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { messageId, action } = await request.json();
    if (!messageId || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, type: true, receiverId: true, senderId: true, conversationId: true, content: true },
    });
    if (!msg || msg.type !== "MENTORSHIP_REQUEST") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (msg.receiverId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let data: any = {};
    try { data = JSON.parse(msg.content); } catch { data = {}; }
    const studentId = msg.senderId;
    const projectId: string | undefined = data.projectId;
    const projectName: string = data.projectName || "the project";
    const mentorName = session.user.name || "The mentor";

    if (action === "ACCEPT") {
      if (projectId) {
        // Add the mentor to the project team (idempotent).
        const existing = await prisma.projectMember.findUnique({
          where: { userId_projectId: { userId: session.user.id, projectId } },
          select: { id: true },
        });
        if (!existing) {
          await prisma.projectMember.create({
            data: { userId: session.user.id, projectId, roleTitle: "Mentor" },
          });
          await prisma.project.update({ where: { id: projectId }, data: { teamSize: { increment: 1 } } });
        }
      }
      await prisma.message.create({
        data: {
          conversationId: msg.conversationId,
          senderId: session.user.id,
          receiverId: studentId,
          content: `${mentorName} accepted your mentorship request for ${projectName}!`,
          type: "MENTORSHIP_ACCEPTED",
          projectId: projectId ?? null,
        },
      });
      await prisma.conversation.update({ where: { id: msg.conversationId }, data: { updatedAt: new Date() } });

      maybeSendMessageEmail({
        conversationId: msg.conversationId,
        recipientId: studentId,
        senderId: session.user.id,
        subject: `Mentorship accepted for ${projectName}! — Swiss Startup Hub`,
        previewText: `${mentorName} accepted your mentorship request. You can now collaborate on ${projectName}.`,
        context: projectName,
      }).catch(() => {});

      // Notify the mentor (themselves) is unnecessary; email the student handled above.
      const mentor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
      if (mentor?.email && projectId) {
        sendEmail({
          to: mentor.email,
          subject: `Mentorship connection accepted — ${projectName}`,
          text: `You accepted the mentorship request. You can now collaborate on ${projectName}: ${APP_URL}/projects/${projectId}`,
          type: "mentorship_accepted",
        }).catch((err) => logger.error("Mentorship accept email failed", { error: String(err) }));
      }
    } else {
      await prisma.message.create({
        data: {
          conversationId: msg.conversationId,
          senderId: session.user.id,
          receiverId: studentId,
          content: `${mentorName} is not available for ${projectName} right now.`,
          type: "MENTORSHIP_DECLINED",
          projectId: projectId ?? null,
        },
      });
      await prisma.conversation.update({ where: { id: msg.conversationId }, data: { updatedAt: new Date() } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Mentorship respond error", { error: String(error) });
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
