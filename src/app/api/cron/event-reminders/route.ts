import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runEventReminders } from "@/lib/eventReminders";
import { logger } from "@/lib/logger";

// Triggered by Vercel Cron every day at 09:00 UTC (see vercel.json).
// Sends 7-day and 1-day reminders for upcoming events.
export async function GET(request: Request) {
  const secret = env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runEventReminders();
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Cron event reminders error", { error: String(error) });
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
