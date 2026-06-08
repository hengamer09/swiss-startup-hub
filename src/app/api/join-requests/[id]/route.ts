import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { status } = await request.json();
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id },
      include: { project: { select: { ownerId: true } } },
    });

    if (!joinRequest) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (joinRequest.project.ownerId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (joinRequest.status !== "PENDING") {
      return NextResponse.json(
        { message: "Already reviewed" },
        { status: 400 }
      );
    }

    const updated = await prisma.joinRequest.update({
      where: { id },
      data: { status, reviewedAt: new Date() },
    });

    if (status === "APPROVED") {
      await prisma.projectMember.upsert({
        where: {
          userId_projectId: {
            userId: joinRequest.userId,
            projectId: joinRequest.projectId,
          },
        },
        update: { roleTitle: "Member" },
        create: {
          userId: joinRequest.userId,
          projectId: joinRequest.projectId,
          roleTitle: "Member",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update join request error:", error);
    return NextResponse.json(
      { message: "Failed to update request" },
      { status: 500 }
    );
  }
}
