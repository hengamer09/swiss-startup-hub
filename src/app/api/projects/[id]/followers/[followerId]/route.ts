import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; followerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, followerId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, followerCount: true },
    });

    if (!project) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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
    console.error("Remove follower error:", error);
    return NextResponse.json(
      { message: "Failed to remove follower" },
      { status: 500 }
    );
  }
}
