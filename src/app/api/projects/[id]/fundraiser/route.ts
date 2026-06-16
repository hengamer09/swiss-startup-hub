import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";

const MAX_GOAL = 10000;
const MIN_GOAL = 100;
const MAX_DAYS = 90;

/* eslint-disable @typescript-eslint/no-explicit-any */

// Public: fetch the active fundraiser (with rewards + supporters) for a project.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const fundraiser = await prisma.fundraiser.findUnique({
      where: { projectId: id },
      include: {
        rewards: { orderBy: { amount: "asc" } },
        pledges: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true, name: true, amount: true, message: true, createdAt: true,
            userId: true, rewardId: true,
          },
        },
      },
    });
    return NextResponse.json({ fundraiser });
  } catch (error) {
    logger.error("Get fundraiser error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load fundraiser" }, { status: 500 });
  }
}

// Owner + student project only: create a fundraiser with optional reward tiers.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, ownerId: true, isStudentProject: true, fundraiser: { select: { id: true } } },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (project.ownerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!project.isStudentProject) {
      return NextResponse.json({ error: "Fundraising is only available for student projects" }, { status: 400 });
    }
    if (project.fundraiser) {
      return NextResponse.json({ error: "This project already has a fundraiser" }, { status: 409 });
    }

    const body = await request.json();
    const goal = Math.floor(Number(body.goal));
    const description = stripTags(String(body.description || "").trim()).slice(0, 1000);
    const deadline = new Date(body.deadline);

    if (!Number.isFinite(goal) || goal < MIN_GOAL || goal > MAX_GOAL) {
      return NextResponse.json({ error: `Goal must be between CHF ${MIN_GOAL} and CHF ${MAX_GOAL}` }, { status: 400 });
    }
    if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });
    const maxDeadline = new Date(Date.now() + MAX_DAYS * 24 * 60 * 60 * 1000);
    if (isNaN(deadline.getTime()) || deadline <= new Date() || deadline > maxDeadline) {
      return NextResponse.json({ error: "Deadline must be in the future, within 90 days" }, { status: 400 });
    }

    // Sanitize reward tiers.
    const rawRewards = Array.isArray(body.rewards) ? body.rewards.slice(0, 10) : [];
    const seen = new Set<number>();
    const rewards = rawRewards
      .map((r: any) => ({
        amount: Math.floor(Number(r.amount)),
        title: stripTags(String(r.title || "").trim()).slice(0, 50),
        description: stripTags(String(r.description || "").trim()).slice(0, 200),
        limit: r.limit ? Math.max(1, Math.floor(Number(r.limit))) : null,
      }))
      .filter((r: any) => Number.isFinite(r.amount) && r.amount > 0 && r.title && r.description && !seen.has(r.amount) && seen.add(r.amount));

    const fundraiser = await prisma.fundraiser.create({
      data: {
        projectId: id,
        goal,
        description,
        deadline,
        rewards: rewards.length > 0 ? { create: rewards } : undefined,
      },
      include: { rewards: { orderBy: { amount: "asc" } } },
    });

    return NextResponse.json(fundraiser, { status: 201 });
  } catch (error) {
    logger.error("Create fundraiser error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to create fundraiser" }, { status: 500 });
  }
}
