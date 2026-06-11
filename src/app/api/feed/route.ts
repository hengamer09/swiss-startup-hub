import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`feed:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 10;

  try {
    const [items, total] = await Promise.all([
      prisma.projectFollower.findMany({
        where: { userId: session.user.id },
        include: {
          project: {
            include: {
              owner: { select: { id: true, name: true, image: true, averageRating: true } },
              _count: { select: { members: true, followers: true } },
            },
          },
        },
        orderBy: { followedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.projectFollower.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      projects: items.map((item) => ({ ...item.project, owner: item.project.owner })),
      count: items.length,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    logger.error("Feed error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load feed" }, { status: 500 });
  }
}
