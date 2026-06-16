import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// The logged-in user's owned projects (for pickers like mentorship requests).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, name: true },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    logger.error("My projects error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}
