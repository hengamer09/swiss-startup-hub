import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; followerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, followerId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, followerCount: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.projectFollower.deleteMany({
      where: { projectId, userId: followerId },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { followerCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Remove follower error", { id: projectId, error: String(error) });
    return NextResponse.json({ error: "Failed to remove follower" }, { status: 500 });
  }
}
