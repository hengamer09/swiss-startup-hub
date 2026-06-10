import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { status, reply } = await request.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const trimmedReply = reply?.trim();
    if (!trimmedReply) {
      return NextResponse.json({ message: "A reply is required before accepting or declining." }, { status: 400 });
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, ownerId: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!joinRequest) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (joinRequest.project.ownerId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (joinRequest.status !== "PENDING") {
      return NextResponse.json({ message: "Already reviewed" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.joinRequest.update({
        where: { id },
        data: {
          status,
          founderReply: trimmedReply,
          reviewedAt: new Date(),
        },
      });

      if (status === "APPROVED") {
        // Add to team with the reply as role title
        await tx.projectMember.upsert({
          where: {
            userId_projectId: {
              userId: joinRequest.userId,
              projectId: joinRequest.projectId,
            },
          },
          update: { roleTitle: trimmedReply },
          create: {
            userId: joinRequest.userId,
            projectId: joinRequest.projectId,
            roleTitle: trimmedReply,
          },
        });

        await tx.project.update({
          where: { id: joinRequest.projectId },
          data: { teamSize: { increment: 1 } },
        });
      }

      // Notify the applicant
      await tx.notification.create({
        data: {
          userId: joinRequest.userId,
          type: status === "APPROVED" ? "join_request_approved" : "join_request_rejected",
          content:
            status === "APPROVED"
              ? `You've been accepted to ${joinRequest.project.name} as ${trimmedReply}!`
              : `Your request to join ${joinRequest.project.name} was declined: ${trimmedReply}`,
          link: `/projects/${joinRequest.projectId}`,
        },
      });

      return result;
    });

    // Send email to applicant — non-critical, failures are swallowed
    if (joinRequest.user.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const projectUrl = `${appUrl}/projects/${joinRequest.projectId}`;
      const founderName = session.user.name || "The founder";
      const applicantName = joinRequest.user.name || "there";
      const projectName = joinRequest.project.name;

      if (status === "APPROVED") {
        await sendEmail({
          to: joinRequest.user.email,
          subject: `You've been accepted to ${projectName}!`,
          text: `Hi ${applicantName},\n\n${founderName} has accepted your request to join ${projectName}.\n\nYour role: ${trimmedReply}\n\nVisit the project: ${projectUrl}`,
          html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#18181b"><p>Hi ${applicantName},</p><p><strong>${founderName}</strong> has accepted your request to join <strong>${projectName}</strong>!</p><p><strong>Your role:</strong> ${trimmedReply}</p><p><a href="${projectUrl}" style="color:#dc2626;">View the project</a></p></div>`,
        }).catch(() => {});
      } else {
        await sendEmail({
          to: joinRequest.user.email,
          subject: `Update on your join request for ${projectName}`,
          text: `Hi ${applicantName},\n\n${founderName} has reviewed your request to join ${projectName}.\n\nMessage from founder: ${trimmedReply}\n\nVisit the project: ${projectUrl}`,
          html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#18181b"><p>Hi ${applicantName},</p><p><strong>${founderName}</strong> has reviewed your request to join <strong>${projectName}</strong>.</p><p><strong>Message from founder:</strong> ${trimmedReply}</p><p><a href="${projectUrl}" style="color:#dc2626;">View the project</a></p></div>`,
        }).catch(() => {});
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update join request error:", error);
    return NextResponse.json(
      { message: "Failed to update request" },
      { status: 500 }
    );
  }
}
