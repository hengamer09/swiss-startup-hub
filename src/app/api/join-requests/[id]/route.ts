import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { APP_URL, stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { findOrCreateConversation, maybeSendMessageEmail } from "@/lib/messaging";
import { addMemberToGroupChat } from "@/lib/groupChat";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { status, role: rawRole, reason: rawReason, reply: rawReply } = await request.json();
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const trimmedRole = status === "APPROVED"
      ? stripTags((rawRole || rawReply || "").trim()).slice(0, 200)
      : "";
    const trimmedReason = stripTags((rawReason || rawReply || "").trim()).slice(0, 1000);

    if (status === "APPROVED" && !trimmedRole) {
      return NextResponse.json({ error: "A role title is required when accepting." }, { status: 400 });
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, ownerId: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!joinRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (joinRequest.project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (joinRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.joinRequest.update({
        where: { id },
        data: { status, founderReply: trimmedReason, reviewedAt: new Date() },
      });

      if (status === "APPROVED") {
        await tx.projectMember.upsert({
          where: {
            userId_projectId: { userId: joinRequest.userId, projectId: joinRequest.projectId },
          },
          update: { roleTitle: trimmedRole },
          create: { userId: joinRequest.userId, projectId: joinRequest.projectId, roleTitle: trimmedRole },
        });
        await tx.project.update({
          where: { id: joinRequest.projectId },
          data: { teamSize: { increment: 1 } },
        });
        // Add the new member to the project group chat with a system message.
        await addMemberToGroupChat(
          tx,
          joinRequest.projectId,
          joinRequest.userId,
          joinRequest.user.name || "A new member",
          trimmedRole
        );
      }

      // Find or create conversation
      const conversationId = await findOrCreateConversation(tx, session.user.id, joinRequest.userId);

      const msgType = status === "APPROVED" ? "JOIN_ACCEPT" : "JOIN_DECLINE";
      const msgContent = status === "APPROVED"
        ? `Your request to join ${joinRequest.project.name} has been accepted! You've been added as ${trimmedRole}.${trimmedReason ? ` ${trimmedReason}` : ""}`
        : `Your request to join ${joinRequest.project.name} was declined. Reason: ${trimmedReason}`;

      await tx.message.create({
        data: {
          conversationId,
          senderId: session.user.id,
          receiverId: joinRequest.userId,
          content: msgContent,
          type: msgType,
          projectId: joinRequest.projectId,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: joinRequest.userId,
          type: status === "APPROVED" ? "join_request_approved" : "join_request_rejected",
          content: status === "APPROVED"
            ? `You've been accepted to ${joinRequest.project.name} as ${trimmedRole}!`
            : `Your request to join ${joinRequest.project.name} was declined: ${trimmedReason}`,
          link: `/projects/${joinRequest.projectId}`,
        },
      });

      return { result, conversationId };
    });

    // Email the applicant
    maybeSendMessageEmail({
      conversationId: updated.conversationId,
      recipientId: joinRequest.userId,
      senderId: session.user.id,
      subject: status === "APPROVED"
        ? `Your request to join ${joinRequest.project.name} was accepted! — Swiss Startup Hub`
        : `Update on your request to join ${joinRequest.project.name} — Swiss Startup Hub`,
      previewText: status === "APPROVED"
        ? `You've been added as ${trimmedRole}.${trimmedReason ? ` ${trimmedReason}` : ""}`
        : `Reason: ${trimmedReason}`,
      context: joinRequest.project.name,
    }).catch(() => {});

    if (joinRequest.user.email) {
      const projectUrl = `${APP_URL}/projects/${joinRequest.projectId}`;
      if (status === "APPROVED") {
        sendEmail({
          to: joinRequest.user.email,
          subject: `You've been accepted to ${joinRequest.project.name}!`,
          text: `Hi ${joinRequest.user.name || "there"},\n\nYour request to join ${joinRequest.project.name} has been accepted!\n\nYour role: ${trimmedRole}${trimmedReason ? `\n\n${trimmedReason}` : ""}\n\nView: ${projectUrl}`,
          html: `<div style="font-family:Arial,sans-serif;line-height:1.5"><p>Hi ${joinRequest.user.name || "there"},</p><p>Your request to join <strong>${joinRequest.project.name}</strong> has been accepted!</p><p><strong>Your role:</strong> ${trimmedRole}</p>${trimmedReason ? `<p>${trimmedReason}</p>` : ""}<p><a href="${projectUrl}" style="color:#dc2626;">View the project</a></p></div>`,
        }).catch((err) => logger.error("Approval email failed", { error: String(err) }));
      } else {
        sendEmail({
          to: joinRequest.user.email,
          subject: `Update on your request to join ${joinRequest.project.name} — Swiss Startup Hub`,
          text: `Hi ${joinRequest.user.name || "there"},\n\nYour request to join ${joinRequest.project.name} was declined.\n\nReason: ${trimmedReason}\n\nView: ${projectUrl}`,
          html: `<div style="font-family:Arial,sans-serif;line-height:1.5"><p>Hi ${joinRequest.user.name || "there"},</p><p>Your request to join <strong>${joinRequest.project.name}</strong> was declined.</p><p><strong>Reason:</strong> ${trimmedReason}</p><p><a href="${projectUrl}" style="color:#dc2626;">View the project</a></p></div>`,
        }).catch((err) => logger.error("Decline email failed", { error: String(err) }));
      }
    }

    return NextResponse.json(updated.result);
  } catch (error) {
    logger.error("Update join request error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
