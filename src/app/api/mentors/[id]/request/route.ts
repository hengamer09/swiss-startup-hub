import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";
import { findOrCreateConversation, maybeSendMessageEmail } from "@/lib/messaging";
import { logger } from "@/lib/logger";

// Student requests mentorship from a mentor — creates a MENTORSHIP_REQUEST message.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(`mentorship:${session.user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id: mentorId } = await params;
  if (mentorId === session.user.id) {
    return NextResponse.json({ error: "You can't request mentorship from yourself" }, { status: 400 });
  }

  try {
    const { projectId, helpText } = await request.json();
    const cleanHelp = stripTags(String(helpText || "").trim()).slice(0, 500);
    if (!projectId || !cleanHelp) {
      return NextResponse.json({ error: "Please select a project and describe what you need help with" }, { status: 400 });
    }

    const [project, mentor] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, ownerId: true } }),
      prisma.user.findUnique({ where: { id: mentorId }, select: { id: true } }),
    ]);
    if (!project || project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!mentor) return NextResponse.json({ error: "Mentor not found" }, { status: 404 });

    const studentName = session.user.name || "A student";
    const conversationId = await findOrCreateConversation(prisma, session.user.id, mentorId);
    await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        receiverId: mentorId,
        content: JSON.stringify({ projectId: project.id, projectName: project.name, helpText: cleanHelp, studentName }),
        type: "MENTORSHIP_REQUEST",
        projectId: project.id,
      },
    });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    maybeSendMessageEmail({
      conversationId,
      recipientId: mentorId,
      senderId: session.user.id,
      subject: `${studentName} requested your mentorship — Swiss Startup Hub`,
      previewText: `${studentName} needs help with ${project.name}: ${cleanHelp}`,
      context: project.name,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Mentorship request error", { mentorId, error: String(error) });
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}
