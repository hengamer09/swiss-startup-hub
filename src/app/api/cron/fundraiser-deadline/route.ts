import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runFundraiserDeadlines } from "@/lib/fundraiserLifecycle";
import { logger } from "@/lib/logger";

// Triggered by Vercel Cron daily — auto-closes expired fundraisers + sends reminders.
export async function GET(request: Request) {
  const secret = env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runFundraiserDeadlines();
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Cron fundraiser-deadline error", { error: String(error) });
    return NextResponse.json({ error: "Failed to process fundraisers" }, { status: 500 });
  }
}
