import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true, roles: true },
            },
          },
        },
        project: {
          select: { id: true, name: true, ownerId: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 }
      );
    }

    // If this conversation is linked to a project, check for a pending join request
    // between the current user and the other participant
    let joinRequest = null;
    if (conversation.projectId) {
      const other = conversation.participants.find((p) => p.userId !== userId);
      if (other) {
        joinRequest = await prisma.joinRequest.findUnique({
          where: {
            userId_projectId: {
              userId: other.userId,
              projectId: conversation.projectId,
            },
          },
          select: {
            id: true,
            status: true,
            motivation: true,
            applicantRole: true,
            links: true,
            userId: true,
            project: {
              select: { id: true, name: true, ownerId: true },
            },
          },
        });
      }
    }

    return NextResponse.json({ ...conversation, joinRequest });
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json(
      { message: "Failed to load conversation" },
      { status: 500 }
    );
  }
}
