import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags, formatStage } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { notifyMatchingUsers } from "@/lib/skillMatch";

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

    const stageChanged =
      typeof updateData.stage === "string" && updateData.stage !== project.stage;
    const rolesChanged =
      updateData.rolesNeeded !== undefined &&
      (updateData.rolesNeeded ?? null) !== (project.rolesNeeded ?? null);

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Stage change → announcement post + notify followers.
    if (stageChanged) {
      const stageLabel = formatStage(updated.stage);
      try {
        await prisma.projectPost.create({
          data: {
            projectId: id,
            authorId: userId,
            content: `🎉 ${updated.name} has moved to ${stageLabel}!`,
            isAnnouncement: true,
          },
        });
        const followers = await prisma.projectFollower.findMany({
          where: { projectId: id },
          select: { userId: true },
          take: 1000,
        });
        if (followers.length > 0) {
          await prisma.notification.createMany({
            data: followers.map((f) => ({
              userId: f.userId,
              type: "project_stage_change",
              content: `${updated.name} has moved to ${stageLabel}!`,
              link: `/projects/${id}`,
            })),
          });
        }
      } catch (err) {
        logger.error("Stage-change announcement failed", { id, error: String(err) });
      }
    }

    // Roles changed → notify matching users (best-effort).
    if (rolesChanged) {
      await notifyMatchingUsers({
        id: updated.id,
        name: updated.name,
        ownerId: updated.ownerId,
        problem: updated.problem,
        rolesNeeded: updated.rolesNeeded,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Update project error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
