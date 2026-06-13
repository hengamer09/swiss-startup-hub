import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const count = await prisma.emailSubscription.count({ where: { subscribed: true } });
    return NextResponse.json({ count });
  } catch (error) {
    logger.error("Subscriber count error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load count" }, { status: 500 });
  }
}
