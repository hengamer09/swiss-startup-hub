import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { stripTags, APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email";
import { verificationEmail } from "@/lib/emailTemplates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`resend-verify-ip:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { email } = await request.json();
    const cleanEmail = stripTags(String(email || "").trim()).toLowerCase();

    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Rate limit: 1 resend per 5 minutes per user.
    if (!checkRateLimit(`resend-verify:${cleanEmail}`, 1, 5 * 60_000)) {
      return NextResponse.json(
        { error: "Please wait a few minutes before requesting another email." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, name: true, emailVerified: true },
    });

    // Always respond success to avoid leaking which emails are registered.
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    const verificationToken = crypto.randomUUID();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationTokenExpiry },
    });

    const verifyUrl = `${APP_URL}/auth/verify?token=${verificationToken}`;
    const { html, text } = verificationEmail(user.name, verifyUrl);
    logger.info("Resending verification email", { userId: user.id });
    await sendEmail({
      to: cleanEmail,
      subject: "Verify your email — Swiss Startup Hub",
      text,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Resend verification error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
