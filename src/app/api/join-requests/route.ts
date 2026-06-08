import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId, motivation, experience, availability, links } =
      await request.json();

    if (!projectId || !motivation?.trim() || !experience?.trim()) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.joinRequest.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Already applied to this project" },
        { status: 409 }
      );
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
        },
      },
    });

    if (member) {
      return NextResponse.json(
        { message: "You are already a member" },
        { status: 409 }
      );
    }

    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId: session.user.id,
        projectId,
        motivation: motivation.trim(),
        experience: experience.trim(),
        availability: availability?.trim() || "",
        links: links?.trim() || null,
      },
    });

    return NextResponse.json(joinRequest, { status: 201 });
  } catch (error) {
    console.error("Create join request error:", error);
    return NextResponse.json(
      { message: "Failed to submit application" },
      { status: 500 }
    );
  }
}
