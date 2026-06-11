import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`report:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { targetId, targetType, reason } = await request.json();

    const cleanReason = stripTags(String(reason || "").trim()).slice(0, 2000);

    if (!targetId || !targetType || !cleanReason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["USER", "PROJECT"].includes(targetType)) {
      return NextResponse.json(
        { error: "Invalid target type" },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetId,
        targetType,
        reason: cleanReason,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    logger.error("Create report error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
