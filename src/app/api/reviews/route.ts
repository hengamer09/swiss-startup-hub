import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { targetId, targetType, rating, feedback } = body;

    if (!targetId || !targetType || !rating || !feedback?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: session.user.id,
        targetId,
        targetType,
        rating: Number(rating),
        feedback: feedback.trim(),
      },
    });

    await sendEmail({
      to: process.env.CONTACT_EMAIL || "hello@swissstartuphub.ch",
      subject: "New review received",
      text: `A new review was left on Swiss Startup Hub for ${targetType} ${targetId}.\n\nRating: ${rating}\nFeedback: ${feedback}`,
    }).catch((error) => console.error("Failed to send review email", error));

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
