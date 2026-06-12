import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUnsubscribeToken } from "@/lib/emailTokens";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const email = token ? parseUnsubscribeToken(String(token)) : null;

    if (!email) {
      return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 });
    }

    // Mark unsubscribed; create the row if it doesn't exist yet.
    await prisma.emailSubscription.upsert({
      where: { email },
      update: { subscribed: false },
      create: { email, subscribed: false },
    });

    logger.info("Email unsubscribed", { email });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Unsubscribe error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
