import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escapeHtml, APP_URL, stripTags, sanitizeUrl } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { findOrCreateConversation, maybeSendMessageEmail } from "@/lib/messaging";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`join-request:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { projectId, motivation, applicantRole, links } = await request.json();
    const trimmedMotivation = stripTags(motivation?.trim() || "").slice(0, 2000);
    const trimmedApplicantRole = stripTags(applicantRole?.trim() || "").slice(0, 200) || null;
    const trimmedLinks = sanitizeUrl(links) || null;

    if (!projectId || !trimmedMotivation || !trimmedApplicantRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for existing PENDING request
    const existing = await prisma.joinRequest.findFirst({
      where: { userId: session.user.id, projectId, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json({ error: "You already have a pending request for this project" }, { status: 409 });
    }

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId } },
    });
    if (member) return NextResponse.json({ error: "You are already a member" }, { status: 409 });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const requesterName = session.user.name || "Someone";

    const joinRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.joinRequest.create({
        data: {
          userId: session.user.id,
          projectId,
          motivation: trimmedMotivation,
          experience: "",
          availability: "FLEXIBLE",
          applicantRole: trimmedApplicantRole,
          links: trimmedLinks,
        },
      });

      // Find or create ONE conversation between applicant and project owner
      const conversationId = await findOrCreateConversation(tx, session.user.id, project.owner.id);

      // Create JOIN_REQUEST message with structured content
      const msgContent = JSON.stringify({
        joinRequestId: created.id,
        projectId: project.id,
        projectName: project.name,
        projectOwnerId: project.owner.id,
        applicantRole: trimmedApplicantRole,
        motivation: trimmedMotivation,
        links: trimmedLinks,
      });

      await tx.message.create({
        data: {
          conversationId,
          senderId: session.user.id,
          receiverId: project.owner.id,
          content: msgContent,
          type: "JOIN_REQUEST",
          projectId: project.id,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: project.owner.id,
          type: "join_request",
          content: `${requesterName} requested to join ${project.name}.`,
          link: `/projects/${project.id}`,
        },
      });

      return { created, conversationId };
    });

    // Send email to project owner
    if (project.owner.email && project.owner.id !== session.user.id) {
      maybeSendMessageEmail({
        conversationId: joinRequest.conversationId,
        recipientId: project.owner.id,
        senderId: session.user.id,
        subject: `New join request from ${requesterName} for ${project.name} — Swiss Startup Hub`,
        previewText: `Role: ${trimmedApplicantRole}\n\n${trimmedMotivation}`,
        context: project.name,
      }).catch(() => {});

      sendEmail({
        to: project.owner.email,
        subject: `New join request for ${project.name}`,
        text: `Hi ${project.owner.name || "there"},\n\n${requesterName} wants to join ${project.name}.\n\nRole: ${trimmedApplicantRole}\nMessage: ${trimmedMotivation}${trimmedLinks ? `\nPortfolio: ${trimmedLinks}` : ""}\n\nView: ${APP_URL}/projects/${project.id}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#18181b"><p>Hi ${escapeHtml(project.owner.name || "there")},</p><p><strong>New join request for ${escapeHtml(project.name)}</strong></p><p><strong>Name:</strong> ${escapeHtml(requesterName)}</p>${trimmedApplicantRole ? `<p><strong>Role:</strong> ${escapeHtml(trimmedApplicantRole)}</p>` : ""}<p><strong>Message:</strong> ${escapeHtml(trimmedMotivation)}</p>${trimmedLinks ? `<p><strong>Portfolio:</strong> ${escapeHtml(trimmedLinks)}</p>` : ""}<p><a href="${APP_URL}/projects/${project.id}" style="color:#dc2626;">View the project</a></p></div>`,
      }).catch((err) => logger.error("Join request email failed", { error: String(err) }));
    }

    return NextResponse.json(joinRequest.created, { status: 201 });
  } catch (error) {
    logger.error("Create join request error", { error: String(error) });
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
