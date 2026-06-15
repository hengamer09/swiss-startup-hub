import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

const PAGE_SIZE = 20;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const updates = await prisma.projectUpdate.findMany({
      where: { projectId: id },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, image: true } } },
    });
    const nextCursor = updates.length === PAGE_SIZE ? updates[updates.length - 1].id : null;
    return NextResponse.json({ updates, nextCursor });
  } catch (error) {
    logger.error("List project updates error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load updates" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`project-update:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true, ownerId: true },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const progress = stripTags(String(body.progress || "").trim()).slice(0, 500);
    const challenge = body.challenge ? stripTags(String(body.challenge).trim()).slice(0, 500) : null;
    if (!progress) return NextResponse.json({ error: "Progress is required" }, { status: 400 });

    const update = await prisma.projectUpdate.create({
      data: { projectId: id, authorId: session.user.id, progress, challenge },
      include: { author: { select: { id: true, name: true, image: true } } },
    });

    // Notify followers in-app.
    const followers = await prisma.projectFollower.findMany({
      where: { projectId: id },
      select: { userId: true },
      take: 1000,
    });
    if (followers.length > 0) {
      await prisma.notification.createMany({
        data: followers
          .filter((f) => f.userId !== session.user.id)
          .map((f) => ({
            userId: f.userId,
            type: "project_update",
            content: `${project.name} posted an update: ${progress.slice(0, 100)}`,
            link: `/projects/${id}`,
          })),
      });
    }

    return NextResponse.json(update, { status: 201 });
  } catch (error) {
    logger.error("Create project update error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to post update" }, { status: 500 });
  }
}
