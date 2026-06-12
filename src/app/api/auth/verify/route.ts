import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
      select: { id: true, email: true, verificationTokenExpiry: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }

    if (user.emailVerified) {
      // Token still present but already verified — treat as success.
      return NextResponse.json({ status: "verified" });
    }

    if (!user.verificationTokenExpiry || user.verificationTokenExpiry.getTime() < Date.now()) {
      return NextResponse.json({ status: "expired" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // Add the verified user to the newsletter/email list.
    await prisma.emailSubscription.upsert({
      where: { email: user.email },
      update: { userId: user.id, subscribed: true },
      create: { email: user.email, userId: user.id, subscribed: true },
    });

    logger.info("Email verified", { userId: user.id });
    return NextResponse.json({ status: "verified" });
  } catch (error) {
    logger.error("Email verification error", { error: String(error) });
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
