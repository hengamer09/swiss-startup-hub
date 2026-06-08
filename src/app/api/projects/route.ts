import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { name, problem, solution, industry, stage, location, isRemote } =
      await request.json();

    const project = await prisma.project.create({
      data: {
        name,
        problem,
        solution,
        industry,
        stage: stage || "IDEA",
        location: location || "Zurich",
        isRemote: isRemote || false,
        ownerId: userId,
        teamSize: 1,
        members: {
          create: {
            userId,
            roleTitle: "Founder",
            isFounder: true,
          },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { message: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const projects = await prisma.project.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: {
            select: { id: true, name: true, image: true, identityVerified: true },
          },
        },
      },
      _count: { select: { followers: true } },
    },
  });

  return NextResponse.json(projects);
}
