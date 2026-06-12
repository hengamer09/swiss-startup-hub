import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { removeMemberFromGroupChat } from "@/lib/groupChat";

// Remove a team member. The owner can remove anyone; a member can remove themselves.
// `memberId` is the userId of the member to remove.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, memberId } = await params;
  const userId = session.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = project.ownerId === userId;
    if (!isOwner && memberId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // The owner is not a removable member.
    if (memberId === project.ownerId) {
      return NextResponse.json({ error: "The owner cannot be removed" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const deleted = await tx.projectMember.deleteMany({
        where: { projectId, userId: memberId },
      });
      if (deleted.count > 0) {
        await tx.project.update({
          where: { id: projectId },
          data: { teamSize: { decrement: 1 } },
        });
      }
      await removeMemberFromGroupChat(tx, projectId, memberId);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Remove member error", { projectId, memberId, error: String(error) });
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
