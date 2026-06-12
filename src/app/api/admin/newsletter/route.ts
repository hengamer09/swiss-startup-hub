import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { newsletterEmail } from "@/lib/emailTemplates";
import { makeUnsubscribeToken } from "@/lib/emailTokens";
import { APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "henri@staehli.biz";
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { subject, htmlContent } = await request.json();

    if (!subject || typeof subject !== "string" || !htmlContent || typeof htmlContent !== "string") {
      return NextResponse.json(
        { error: "subject and htmlContent are required" },
        { status: 400 }
      );
    }

    const subscribers = await prisma.emailSubscription.findMany({
      where: { subscribed: true },
      select: { email: true },
    });

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async ({ email }) => {
          const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${makeUnsubscribeToken(email)}`;
          const { html, text } = newsletterEmail(subject, htmlContent, unsubscribeUrl);
          return sendEmail({ to: email, subject, text, html });
        })
      );
      for (const ok of results) ok ? sent++ : failed++;
      if (i + BATCH_SIZE < subscribers.length) await sleep(BATCH_DELAY_MS);
    }

    logger.info("Newsletter sent", { sent, failed, total: subscribers.length });
    return NextResponse.json({ sent, failed });
  } catch (error) {
    logger.error("Newsletter send error", { error: String(error) });
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 });
  }
}
