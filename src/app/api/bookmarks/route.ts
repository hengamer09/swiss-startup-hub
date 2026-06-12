import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            industry: true,
            stage: true,
            location: true,
            problem: true,
          },
        },
      },
    });
    return NextResponse.json({ bookmarks });
  } catch (error) {
    logger.error("List bookmarks error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load bookmarks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`bookmark:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { projectId } = await request.json();
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const existing = await prisma.bookmark.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "Already bookmarked", id: existing.id }, { status: 409 });
    }

    const bookmark = await prisma.bookmark.create({
      data: { userId: session.user.id, projectId },
    });
    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    logger.error("Create bookmark error", { error: String(error) });
    return NextResponse.json({ error: "Failed to save bookmark" }, { status: 500 });
  }
}
