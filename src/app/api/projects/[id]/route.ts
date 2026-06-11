import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        openRoles: true,
        faqs: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    logger.error("Get project error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.ownerId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const data = await request.json();
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = stripTags(String(data.name).trim()).slice(0, 100);
    if (data.problem !== undefined) updateData.problem = stripTags(String(data.problem).trim()).slice(0, 2000);
    if (data.solution !== undefined) updateData.solution = stripTags(String(data.solution).trim()).slice(0, 2000);
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.isRemote !== undefined) updateData.isRemote = data.isRemote;
    if (data.targetCustomer !== undefined) updateData.targetCustomer = stripTags(String(data.targetCustomer).trim()).slice(0, 200);
    if (data.scope !== undefined) updateData.scope = data.scope;
    if (data.competitiveLandscape !== undefined) updateData.competitiveLandscape = stripTags(String(data.competitiveLandscape).trim()).slice(0, 2000);
    if (data.investorPitch !== undefined) updateData.investorPitch = stripTags(String(data.investorPitch).trim()).slice(0, 2000);
    if (data.fundingAmount !== undefined) updateData.fundingAmount = data.fundingAmount;
    if (data.useOfFunds !== undefined) updateData.useOfFunds = stripTags(String(data.useOfFunds).trim()).slice(0, 2000);
    if (data.tractionMetrics !== undefined) updateData.tractionMetrics = stripTags(String(data.tractionMetrics).trim()).slice(0, 2000);
    if (data.investorVisible !== undefined) updateData.investorVisible = data.investorVisible;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.seriousness !== undefined) updateData.seriousness = data.seriousness;
    if (data.teamCompensation !== undefined) updateData.teamCompensation = data.teamCompensation;
    if (data.rolesNeeded !== undefined) {
      try {
        const parsed = JSON.parse(String(data.rolesNeeded));
        if (Array.isArray(parsed)) {
          const sanitized = parsed.slice(0, 20).map((r: any) => ({
            title: stripTags(String(r.title || "").trim()).slice(0, 100),
            description: stripTags(String(r.description || "").trim()).slice(0, 300),
          })).filter((r) => r.title);
          updateData.rolesNeeded = sanitized.length > 0 ? JSON.stringify(sanitized) : null;
        }
      } catch { updateData.rolesNeeded = null; }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Update project error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
