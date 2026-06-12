import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id, participants: { some: { userId } } },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, image: true, roles: true } } },
        },
        project: { select: { id: true, name: true, ownerId: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, image: true } },
            project: { select: { id: true, name: true } },
            event: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Find any pending join requests between the two participants
    const other = conversation.participants.find((p) => p.userId !== userId);
    let joinRequest = null;
    if (other) {
      // Check if other person has a pending request for a project the current user owns
      joinRequest = await prisma.joinRequest.findFirst({
        where: {
          userId: other.userId,
          status: "PENDING",
          project: { ownerId: userId },
        },
        select: {
          id: true,
          status: true,
          motivation: true,
          applicantRole: true,
          links: true,
          userId: true,
          project: { select: { id: true, name: true, ownerId: true } },
        },
      });
      // Also check if current user has a pending request for a project the other person owns
      if (!joinRequest) {
        joinRequest = await prisma.joinRequest.findFirst({
          where: {
            userId,
            status: "PENDING",
            project: { ownerId: other.userId },
          },
          select: {
            id: true,
            status: true,
            motivation: true,
            applicantRole: true,
            links: true,
            userId: true,
            project: { select: { id: true, name: true, ownerId: true } },
          },
        });
      }
    }

    return NextResponse.json({ ...conversation, joinRequest });
  } catch (error) {
    logger.error("Get conversation error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}
