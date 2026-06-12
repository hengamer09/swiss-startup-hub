import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { findOrCreateConversation } from "@/lib/messaging";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const posts = await prisma.projectPost.findMany({
      where: { projectId: id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json(posts);
  } catch (error) {
    logger.error("Get project posts error", { id, error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Public chat: any authenticated user can post. This is intentional.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const content = stripTags(String(body.content || "").trim()).slice(0, 5000);

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const post = await prisma.projectPost.create({
      data: {
        projectId: id,
        authorId: session.user.id,
        content,
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
      },
    });

    if (project && project.owner.id !== session.user.id) {
      const conversationId = await findOrCreateConversation(prisma, session.user.id, project.owner.id);
      const preview = content.slice(0, 80);
      await prisma.message.create({
        data: {
          conversationId,
          senderId: session.user.id,
          receiverId: project.owner.id,
          content: `\u{1F4AC} ${session.user.name || "Someone"} posted in ${project.name} discussion: "${preview}${content.length > 80 ? "…" : ""}" — View discussion`,
          type: "BOT_NOTIFICATION",
          projectId: project.id,
        },
      });
      await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error("Create project post error", { id, error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
