import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId, motivation, experience, availability, links } =
      await request.json();

    if (!projectId || !motivation?.trim() || !experience?.trim()) {
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

    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId: session.user.id,
        projectId,
        motivation: motivation.trim(),
        experience: experience.trim(),
        availability: availability?.trim() || "",
        links: links?.trim() || null,
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, email: true, name: true } } } },
      },
    });

    if (project) {
      const requesterName = session.user.name || "Someone";
      const projectLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/projects/${project.id}`;
      const recipients = [project.owner, ...project.members.map((member) => member.user)]
        .filter(
          (user): user is { id: string; name: string; email: string } =>
            Boolean(user) && user.id !== session.user.id
        )
        .filter((user, index, list) => list.findIndex((item) => item.id === user.id) === index);

      if (recipients.length > 0) {
        await prisma.notification.createMany({
          data: recipients.map((user) => ({
            userId: user.id,
            type: "join_request",
            content: `${requesterName} requested to join ${project.name}.`,
            link: projectLink,
          })),
        });

        await Promise.all(
          recipients.map(async (user) => {
            if (!user.email) return;

            await sendEmail({
              to: user.email,
              subject: `${requesterName} wants to join ${project.name}`,
              text: [
                `Hi ${user.name || "there"},`,
                `${requesterName} requested to join ${project.name}.`,
                `Message: ${motivation.trim()}`,
                `Experience: ${experience.trim()}`,
                `Availability: ${availability?.trim() || "Flexible"}`,
                links?.trim() ? `Links: ${links.trim()}` : undefined,
                `Project link: ${projectLink}`,
              ]
                .filter(Boolean)
                .join("\n\n"),
              html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #18181b;">
                  <p>Hi ${user.name || "there"},</p>
                  <p><strong>${requesterName}</strong> requested to join <strong>${project.name}</strong>.</p>
                  <p><strong>Motivation:</strong> ${motivation.trim()}</p>
                  <p><strong>Experience:</strong> ${experience.trim()}</p>
                  <p><strong>Availability:</strong> ${availability?.trim() || "Flexible"}</p>
                  ${links?.trim() ? `<p><strong>Links:</strong> ${links.trim()}</p>` : ""}
                  <p><a href="${projectLink}" style="color:#dc2626;">View the project</a></p>
                </div>
              `,
            });
          })
        );
      }
    }

    return NextResponse.json(joinRequest, { status: 201 });
  } catch (error) {
    console.error("Create join request error:", error);
    return NextResponse.json(
      { message: "Failed to submit application" },
      { status: 500 }
    );
  }
}
