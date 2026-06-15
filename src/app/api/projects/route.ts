import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { createProjectGroupChat } from "@/lib/groupChat";
import { notifyMatchingUsers } from "@/lib/skillMatch";

const PAGE_SIZE = 20;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`projects-post:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const userId = session.user.id;

  try {
    const data = await request.json();
    const {
      industry,
      stage,
      location,
      isRemote,
      scope,
      fundingAmount,
      investorVisible,
      seriousness,
      teamCompensation,
      logo,
    } = data;

    const name = stripTags(String(data.name || "").trim()).slice(0, 100);
    const problem = stripTags(String(data.problem || "").trim()).slice(0, 2000);
    const solution = stripTags(String(data.solution || "").trim()).slice(0, 2000);
    const targetCustomer = data.targetCustomer ? stripTags(String(data.targetCustomer).trim()).slice(0, 200) : null;
    const competitiveLandscape = data.competitiveLandscape ? stripTags(String(data.competitiveLandscape).trim()).slice(0, 2000) : null;
    const investorPitch = data.investorPitch ? stripTags(String(data.investorPitch).trim()).slice(0, 2000) : null;
    const useOfFunds = data.useOfFunds ? stripTags(String(data.useOfFunds).trim()).slice(0, 2000) : null;
    const tractionMetrics = data.tractionMetrics ? stripTags(String(data.tractionMetrics).trim()).slice(0, 2000) : null;
    const rolesNeeded = (() => {
      if (!data.rolesNeeded) return null;
      try {
        const parsed = JSON.parse(String(data.rolesNeeded));
        if (!Array.isArray(parsed) || parsed.length === 0) return null;
        const sanitized = parsed.slice(0, 20).map((r: any) => ({
          title: stripTags(String(r.title || "").trim()).slice(0, 100),
          description: stripTags(String(r.description || "").trim()).slice(0, 300),
        })).filter((r) => r.title);
        return sanitized.length > 0 ? JSON.stringify(sanitized) : null;
      } catch { return null; }
    })();

    const project = await prisma.project.create({
      data: {
        name,
        problem,
        solution,
        industry,
        stage: stage || "IDEA",
        location: location || "Zurich",
        isRemote: isRemote || false,
        targetCustomer: targetCustomer || null,
        scope: scope || null,
        competitiveLandscape: competitiveLandscape || null,
        investorPitch: investorPitch || null,
        fundingAmount: fundingAmount ?? null,
        useOfFunds: useOfFunds || null,
        tractionMetrics: tractionMetrics || null,
        investorVisible: investorVisible || false,
        seriousness: seriousness || "SIDE_PROJECT",
        teamCompensation: teamCompensation || "UNPAID",
        logo: logo || null,
        rolesNeeded: rolesNeeded || null,
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

    // Auto-create the project group chat with a welcome message (best-effort).
    try {
      await createProjectGroupChat(prisma, {
        id: project.id,
        name: project.name,
        ownerId: userId,
        problem: project.problem,
        solution: project.solution,
        industry: project.industry,
      });
    } catch (err) {
      logger.error("Group chat creation failed", { projectId: project.id, error: String(err) });
    }

    // Notify users whose skills match the project's open roles (best-effort).
    await notifyMatchingUsers({
      id: project.id,
      name: project.name,
      ownerId: userId,
      problem: project.problem,
      rolesNeeded: project.rolesNeeded,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    logger.error("Create project error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`projects-list:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const projects = await prisma.project.findMany({
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE_SIZE,
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
        _count: { select: { followers: true, members: true, updates: true, posts: true } },
      },
    });

    const nextCursor = projects.length === PAGE_SIZE ? projects[projects.length - 1].id : null;
    return NextResponse.json({ projects, nextCursor });
  } catch (error) {
    logger.error("List projects error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
