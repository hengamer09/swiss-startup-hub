import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { interestEmail } from "@/lib/emailTemplates";
import { findOrCreateConversation } from "@/lib/messaging";
import { APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`interest:${session.user.id}:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const userId = session.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true, ownerId: true, owner: { select: { email: true } } },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (project.ownerId === userId) {
      return NextResponse.json({ error: "You own this project" }, { status: 400 });
    }

    const existing = await prisma.projectInterest.findUnique({
      where: { userId_projectId: { userId, projectId: id } },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ success: true, alreadyInterested: true });

    await prisma.projectInterest.create({ data: { projectId: id, userId } });

    const name = session.user.name || "Someone";
    const projectUrl = `${APP_URL}/projects/${id}`;

    // In-app message to the founder (best-effort).
    try {
      const conversationId = await findOrCreateConversation(prisma, userId, project.ownerId);
      await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          receiverId: project.ownerId,
          content: `🎯 ${name} is interested in ${project.name}! View their profile: ${APP_URL}/profile/${userId}`,
          type: "BOT_NOTIFICATION",
          projectId: id,
        },
      });
      await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    } catch (err) {
      logger.error("Interest message failed", { id, error: String(err) });
    }

    // Throttled email to the founder: max 1 per hour per project (batches bursts).
    if (project.owner?.email && checkRateLimit(`interest-email:${id}`, 1, 60 * 60 * 1000)) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await prisma.projectInterest.count({
        where: { projectId: id, createdAt: { gte: hourAgo } },
      });
      const { html, text } = interestEmail(project.name, name, recentCount, projectUrl);
      sendEmail({
        to: project.owner.email,
        subject:
          recentCount > 1
            ? `${recentCount} people expressed interest in ${project.name} — Swiss Startup Hub`
            : `New interest in ${project.name} from ${name} — Swiss Startup Hub`,
        text,
        html,
        type: "interest",
      }).catch((err) => logger.error("Interest email failed", { error: String(err) }));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Express interest error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to record interest" }, { status: 500 });
  }
}
