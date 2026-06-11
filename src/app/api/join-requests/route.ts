import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml, APP_URL } from "@/lib/utils";

type Recipient = {
  id: string;
  name: string;
  email: string;
};

function buildJoinRequestMessage({
  requesterName,
  projectName,
  applicantRole,
  motivation,
  links,
}: {
  requesterName: string;
  projectName: string;
  applicantRole: string | null;
  motivation: string;
  links: string | null;
}) {
  const lines = [
    `New join request for ${projectName}`,
    "",
    `Name: ${requesterName}`,
  ];
  if (applicantRole) lines.push(`Role: ${applicantRole}`);
  lines.push(`Message: ${motivation}`);
  if (links) lines.push(`Portfolio / Links: ${links}`);
  return lines.join("\n");
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId, motivation, applicantRole, links } =
      await request.json();

    const trimmedMotivation = motivation?.trim();
    const trimmedApplicantRole = applicantRole?.trim() || null;
    const trimmedLinks = links?.trim() || null;

    if (!projectId || !trimmedMotivation || !trimmedApplicantRole) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.joinRequest.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already applied to this project" },
        { status: 409 }
      );
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
        },
      },
    });

    if (member) {
      return NextResponse.json(
        { error: "You are already a member" },
        { status: 409 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, email: true, name: true } } } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const requesterName = session.user.name || "Someone";
    const appUrl = APP_URL;
    const projectPath = `/projects/${project.id}`;
    const projectLink = `${appUrl}${projectPath}`;
    const recipients = [project.owner, ...project.members.map((m) => m.user)]
      .filter(
        (user): user is Recipient =>
          Boolean(user) && user.id !== session.user.id
      )
      .filter(
        (user, index, list) =>
          list.findIndex((item) => item.id === user.id) === index
      );
    const messageContent = buildJoinRequestMessage({
      requesterName,
      projectName: project.name,
      applicantRole: trimmedApplicantRole,
      motivation: trimmedMotivation,
      links: trimmedLinks,
    });

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

      if (recipients.length > 0) {
        await tx.notification.createMany({
          data: recipients.map((user) => ({
            userId: user.id,
            type: "join_request",
            content: `${requesterName} requested to join ${project.name}.`,
            link: projectPath,
          })),
        });

        await Promise.all(
          recipients.map(async (user) => {
            // Check if a conversation already exists between them for this project
            const existing = await tx.conversation.findFirst({
              where: {
                projectId: project.id,
                AND: [
                  { participants: { some: { userId: session.user.id } } },
                  { participants: { some: { userId: user.id } } },
                ],
              },
            });

            if (existing) {
              // Add message to existing conversation
              await tx.message.create({
                data: {
                  conversationId: existing.id,
                  senderId: session.user.id,
                  receiverId: user.id,
                  content: messageContent,
                },
              });
              await tx.conversation.update({
                where: { id: existing.id },
                data: { updatedAt: new Date() },
              });
            } else {
              await tx.conversation.create({
                data: {
                  projectId: project.id,
                  participants: {
                    create: [
                      { userId: session.user.id },
                      { userId: user.id },
                    ],
                  },
                  messages: {
                    create: {
                      senderId: session.user.id,
                      receiverId: user.id,
                      content: messageContent,
                    },
                  },
                },
              });
            }
          })
        );
      }

      return created;
    });

    await Promise.allSettled(
      recipients.map(async (user) => {
        if (!user.email) return;

        const emailText = [
          `Hi ${user.name || "there"},`,
          "",
          messageContent,
          "",
          `Project link: ${projectLink}`,
        ].join("\n");

        await sendEmail({
          to: user.email,
          subject: `New join request for ${project.name}`,
          text: emailText,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #18181b;">
              <p>Hi ${escapeHtml(user.name || "there")},</p>
              <p><strong>New join request for ${escapeHtml(project.name)}</strong></p>
              <p><strong>Name:</strong> ${escapeHtml(requesterName)}</p>
              ${trimmedApplicantRole ? `<p><strong>Role:</strong> ${escapeHtml(trimmedApplicantRole)}</p>` : ""}
              <p><strong>Message:</strong> ${escapeHtml(trimmedMotivation)}</p>
              ${trimmedLinks ? `<p><strong>Portfolio / Links:</strong> ${escapeHtml(trimmedLinks)}</p>` : ""}
              <p><a href="${escapeHtml(projectLink)}" style="color:#dc2626;">View the project</a></p>
            </div>
          `,
        });
      })
    );

    return NextResponse.json(joinRequest, { status: 201 });
  } catch (error) {
    console.error("Create join request error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
