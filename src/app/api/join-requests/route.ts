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
      const recipients = [project.owner, ...project.members.map((member) => member.user)].filter(
        (user) => user && user.id !== session.user.id
      );

      await prisma.notification.createMany({
        data: recipients.map((user) => ({
          userId: user.id,
          type: "join_request",
          content: `${session.user.name || "Someone"} applied to join ${project.name}.`,
          link: `/projects/${project.id}`,
        })),
      });

      if (project.owner.email) {
        await sendEmail({
          to: project.owner.email,
          subject: "New join request for your project",
          text: `${session.user.name || "A founder"} applied to join ${project.name}. Review the application in the app.`,
          html: `<p>${session.user.name || "A founder"} applied to join <strong>${project.name}</strong>.</p><p>Review the application in the app.</p>`,
        });
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
