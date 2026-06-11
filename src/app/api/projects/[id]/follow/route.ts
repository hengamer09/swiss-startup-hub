import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  try {
    const existing = await prisma.projectFollower.findUnique({
      where: { userId_projectId: { userId, projectId: id } },
    });

    if (existing) {
      await prisma.projectFollower.delete({
        where: { id: existing.id },
      });
      await prisma.project.update({
        where: { id },
        data: { followerCount: { decrement: 1 } },
      });
      return NextResponse.json({ followed: false });
    }

    await prisma.projectFollower.create({
      data: { userId, projectId: id },
    });
    await prisma.project.update({
      where: { id },
      data: { followerCount: { increment: 1 } },
    });

    return NextResponse.json({ followed: true });
  } catch (error) {
    logger.error("Follow project error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to update follow status" }, { status: 500 });
  }
}
