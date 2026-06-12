import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runWeeklyDigest } from "@/lib/digest";
import { logger } from "@/lib/logger";

// Triggered by Vercel Cron every Monday at 08:00 UTC (see vercel.json).
export async function GET(request: Request) {
  const secret = env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyDigest();
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Cron weekly digest error", { error: String(error) });
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 });
  }
}
