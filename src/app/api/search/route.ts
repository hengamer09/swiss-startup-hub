import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`search:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "projects";
  const query = searchParams.get("q") || "";
  const industries = searchParams.getAll("industry");
  const stages = searchParams.getAll("stage");
  const location = searchParams.get("location") || "";
  const lookingFor = searchParams.getAll("lookingFor");
  const minTeamSize = searchParams.get("minTeamSize");
  const minRating = searchParams.get("minRating");
  const verifiedOnly = searchParams.get("verifiedOnly") === "true";
  const activeRecently = searchParams.get("activeRecently") === "true";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 12;
  const skip = (page - 1) * limit;

  try {
  if (type === "people") {
    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { bio: { contains: query } },
      ];
    }

    if (location) where.location = { contains: location };

    const orderBy: Record<string, string> =
      sort === "newest" ? { createdAt: "desc" } : { averageRating: "desc" };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: where as any,
        orderBy: orderBy as any,
        skip,
        take: limit,
        omit: { passwordHash: true, email: true },
        include: {
          skills: { include: { skill: true }, take: 3 },
          _count: { select: { ratingsReceived: true } },
        },
      }),
      prisma.user.count({ where: where as any }),
    ]);

    return NextResponse.json({ results: users, total, page, totalPages: Math.ceil(total / limit) });
  }

  const where: Record<string, unknown> = {};
  const AND: Record<string, unknown>[] = [];

  if (query) {
    AND.push({
      OR: [
        { name: { contains: query } },
        { problem: { contains: query } },
        { solution: { contains: query } },
      ],
    });
  }

  if (industries.length > 0) {
    AND.push({ industry: { in: industries } });
  }

  if (stages.length > 0) {
    AND.push({ stage: { in: stages } });
  }

  if (location) {
    AND.push({ location: { contains: location } });
  }

  if (lookingFor.length > 0) {
    AND.push({
      openRoles: {
        some: {
          title: { in: lookingFor },
        },
      },
    });
  }

  if (minTeamSize) {
    const size = parseInt(minTeamSize);
    AND.push({ teamSize: { gte: size } });
  }

  if (minRating) {
    AND.push({
      owner: { averageRating: { gte: parseFloat(minRating) } },
    });
  }

  if (verifiedOnly) {
    AND.push({
      owner: { identityVerified: true },
    });
  }

  if (activeRecently) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    AND.push({ updatedAt: { gte: thirtyDaysAgo } });
  }

  if (AND.length > 0) where.AND = AND;

  const orderBy: Record<string, unknown> =
    sort === "newest"
      ? { createdAt: "desc" }
      : sort === "followers"
        ? { followerCount: "desc" }
        : sort === "rating"
          ? { owner: { averageRating: "desc" } }
          : { updatedAt: "desc" };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: where as any,
      orderBy: orderBy as any,
      skip,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, image: true, averageRating: true, identityVerified: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, identityVerified: true } },
          },
          take: 3,
        },
        openRoles: { take: 3 },
        _count: { select: { followers: true } },
      },
    }),
    prisma.project.count({ where: where as any }),
  ]);

  return NextResponse.json({ results: projects, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error("Search error", { error: String(error) });
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
