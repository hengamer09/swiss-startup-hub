import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { APP_URL } from "@/lib/utils";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const posts = await prisma.projectPost.findMany({
      where: { projectId: id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Get project posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const post = await prisma.projectPost.create({
      data: {
        projectId: id,
        authorId: session.user.id,
        content: content.trim(),
        isAnnouncement: false,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (project) {
      const recipients = [project.owner, ...project.members.map((member) => member.user)]
        .filter((user): user is { id: string; name: string; email: string } => Boolean(user) && user.id !== session.user.id)
        .filter((user, index, list) => list.findIndex((item) => item.id === user.id) === index);

      await prisma.notification.createMany({
        data: recipients.map((user) => ({
          userId: user.id,
          type: "project_post",
          content: `${session.user.name || "Someone"} posted in ${project.name}.`,
          link: `/projects/${project.id}`,
        })),
      });

      await Promise.allSettled(
        recipients.map(async (user) => {
          if (!user.email) return;

          await sendEmail({
            to: user.email,
            subject: `New discussion post on ${project.name}`,
            text: `${session.user.name || "Someone"} posted a new message in ${project.name}:\n\n${content.trim()}\n\nView the project: ${APP_URL}/projects/${project.id}`,
            html: `<div style="font-family: Arial, sans-serif; color: #18181b; line-height: 1.5;"><p>Hi ${user.name || "there"},</p><p><strong>${session.user.name || "Someone"}</strong> posted a new message in <strong>${project.name}</strong>.</p><p>${content.trim()}</p><p><a href="${APP_URL}/projects/${project.id}" style="color:#dc2626;">Open the project</a></p></div>`,
          });
        })
      );
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create project post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
