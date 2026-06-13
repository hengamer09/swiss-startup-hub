import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runWeeklyDigest } from "@/lib/digest";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await runWeeklyDigest();
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Weekly digest error", { error: String(error) });
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 });
  }
}
