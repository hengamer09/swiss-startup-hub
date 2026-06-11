import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const { title, skills, commitment, description } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const role = await prisma.openRole.create({
      data: {
        projectId: id,
        title,
        skills: JSON.stringify(skills || []),
        commitment,
        description,
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error("Create open role error:", error);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const userId = session.user.id;

  try {
    const { roleId } = await request.json();

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.ownerId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.openRole.delete({ where: { id: roleId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete open role error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
