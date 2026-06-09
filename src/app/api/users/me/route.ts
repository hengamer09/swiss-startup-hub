import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const data = await request.json();

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.canton !== undefined) updateData.canton = data.canton;
    if (data.portfolioUrl !== undefined) updateData.portfolioUrl = data.portfolioUrl;
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
    if (data.githubUrl !== undefined) updateData.githubUrl = data.githubUrl;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.portfolioProjects !== undefined) updateData.portfolioProjects = data.portfolioProjects;
    if (data.roles !== undefined) updateData.roles = JSON.stringify(data.roles);
    if (data.openToMessages !== undefined)
      updateData.openToMessages = data.openToMessages;
    if (data.preferredStage !== undefined)
      updateData.preferredStage = data.preferredStage;
    if (data.ticketSizeMin !== undefined)
      updateData.ticketSizeMin = data.ticketSizeMin;
    if (data.ticketSizeMax !== undefined)
      updateData.ticketSizeMax = data.ticketSizeMax;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      skills: { include: { skill: true } },
      memberships: {
        include: { project: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(user);
}
