import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`rating:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const fromUserId = session.user.id;

  try {
    const { toUserId, projectId, stars, comment: rawComment } = await request.json();
    const comment = rawComment ? stripTags(String(rawComment).trim()).slice(0, 1000) : null;

    if (!toUserId || !projectId || !stars || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "Invalid rating data" }, { status: 400 });
    }

    if (toUserId === fromUserId) {
      return NextResponse.json({ error: "Cannot rate yourself" }, { status: 400 });
    }

    const existing = await prisma.rating.findUnique({
      where: { fromUserId_toUserId_projectId: { fromUserId, toUserId, projectId } },
    });

    if (existing) {
      await prisma.rating.update({
        where: { id: existing.id },
        data: { stars, comment },
      });
    } else {
      await prisma.rating.create({
        data: { fromUserId, toUserId, projectId, stars, comment },
      });
    }

    const agg = await prisma.rating.aggregate({
      where: { toUserId },
      _avg: { stars: true },
      _count: { stars: true },
    });

    await prisma.user.update({
      where: { id: toUserId },
      data: {
        averageRating: agg._avg.stars || 0,
        ratingCount: agg._count.stars,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Rating error", { error: String(error) });
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
