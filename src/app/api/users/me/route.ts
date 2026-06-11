import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const data = await request.json();

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = stripTags(String(data.name).trim()).slice(0, 100);
    if (data.bio !== undefined) updateData.bio = stripTags(String(data.bio).trim()).slice(0, 1000);
    if (data.image !== undefined) updateData.image = data.image;
    if (data.location !== undefined) updateData.location = stripTags(String(data.location).trim()).slice(0, 200);
    if (data.country !== undefined) updateData.country = data.country;
    if (data.canton !== undefined) updateData.canton = data.canton;
    if (data.portfolioUrl !== undefined) updateData.portfolioUrl = String(data.portfolioUrl).slice(0, 500);
    if (data.websiteUrl !== undefined) updateData.websiteUrl = String(data.websiteUrl).slice(0, 500);
    if (data.githubUrl !== undefined) updateData.githubUrl = String(data.githubUrl).slice(0, 500);
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = String(data.linkedinUrl).slice(0, 500);
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
      omit: { passwordHash: true },
    });

    if (data.skills !== undefined && Array.isArray(data.skills)) {
      await prisma.userSkill.deleteMany({ where: { userId } });
      for (const raw of (data.skills as unknown[]).slice(0, 20)) {
        const name = stripTags(String(raw).trim()).slice(0, 100);
        if (!name) continue;
        const skill = await prisma.skill.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        await prisma.userSkill.create({ data: { userId, skillId: skill.id } });
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error("Update user error", { userId, error: String(error) });
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      omit: { passwordHash: true },
      include: {
        skills: { include: { skill: true } },
        memberships: {
          include: { project: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    logger.error("Get user error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
