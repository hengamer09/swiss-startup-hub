import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { stripTags } from "@/lib/utils";
import { env } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`review:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { targetId, targetType, rating } = body;

    const feedback = stripTags(String(body.feedback || "").trim()).slice(0, 2000);

    if (!targetId || !targetType || !rating || !feedback) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: session.user.id,
        targetId,
        targetType,
        rating: Number(rating),
        feedback,
      },
    });

    await sendEmail({
      to: env.CONTACT_EMAIL,
      subject: "New review received",
      text: `A new review was left on Swiss Startup Hub for ${targetType} ${targetId}.\n\nRating: ${rating}\nFeedback: ${feedback}`,
    }).catch((error) => logger.error("Failed to send review email", { error: String(error) }));

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    logger.error("Create review error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
