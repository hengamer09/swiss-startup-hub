import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

type Recipient = {
  id: string;
  name: string;
  email: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAvailability(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildJoinRequestMessage({
  requesterName,
  projectName,
  motivation,
  experience,
  availability,
  links,
}: {
  requesterName: string;
  projectName: string;
  motivation: string;
  experience: string;
  availability: string;
  links: string | null;
}) {
  return [
    `New join request for ${projectName}`,
    "",
    `Name: ${requesterName}`,
    `Project: ${projectName}`,
    `Motivation: ${motivation}`,
    `Experience: ${experience}`,
    `Availability: ${formatAvailability(availability)}`,
    links ? `Links: ${links}` : "Links: None provided",
  ].join("\n");
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId, motivation, experience, availability, links } =
      await request.json();

    const trimmedMotivation = motivation?.trim();
    const trimmedExperience = experience?.trim();
    const trimmedAvailability = availability?.trim() || "FLEXIBLE";
    const trimmedLinks = links?.trim() || null;

    if (!projectId || !trimmedMotivation) {
      return NextResponse.json(
        { message: "Missing required fields" },
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
        { message: "Already applied to this project" },
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
        { message: "You are already a member" },
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
        { message: "Project not found" },
        { status: 404 }
      );
    }

    const requesterName = session.user.name || "Someone";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const projectPath = `/projects/${project.id}`;
    const projectLink = `${appUrl}${projectPath}`;
    const recipients = [project.owner, ...project.members.map((member) => member.user)]
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
      motivation: trimmedMotivation,
      experience: trimmedExperience,
      availability: trimmedAvailability,
      links: trimmedLinks,
    });

    const joinRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.joinRequest.create({
        data: {
          userId: session.user.id,
          projectId,
          motivation: trimmedMotivation,
          experience: trimmedExperience,
          availability: trimmedAvailability,
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
              <p><strong>Project:</strong> ${escapeHtml(project.name)}</p>
              <p><strong>Motivation:</strong> ${escapeHtml(trimmedMotivation)}</p>
              <p><strong>Experience:</strong> ${escapeHtml(trimmedExperience)}</p>
              <p><strong>Availability:</strong> ${escapeHtml(formatAvailability(trimmedAvailability))}</p>
              <p><strong>Links:</strong> ${escapeHtml(trimmedLinks || "None provided")}</p>
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
      { message: "Failed to submit application" },
      { status: 500 }
    );
  }
}
