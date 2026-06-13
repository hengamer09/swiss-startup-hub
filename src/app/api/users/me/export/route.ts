import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  if (!checkRateLimit(`export:${userId}`, 2, 60 * 60 * 1_000)) {
    return NextResponse.json(
      { error: "You can only export your data twice per hour. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: { include: { skill: true } },
        ownedProjects: {
          include: { openRoles: true, members: { include: { user: { select: { id: true, name: true } } } } },
        },
        joinRequests: { include: { project: { select: { id: true, name: true } } } },
        organizedEvents: true,
        reviewsGiven: { select: { id: true, targetId: true, targetType: true, rating: true, feedback: true, createdAt: true } },
        reviewsReceived: { select: { id: true, reviewerId: true, targetType: true, rating: true, feedback: true, createdAt: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      take: 200,
      include: {
        messages: {
          where: { senderId: userId },
          select: { id: true, content: true, createdAt: true, receiverId: true },
          orderBy: { createdAt: "asc" },
          take: 1000,
        },
      },
    });

    const { passwordHash, ...safeUser } = user as typeof user & { passwordHash?: string };
    void passwordHash;

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        ...safeUser,
        skills: user.skills.map((us) => us.skill.name),
      },
      projects: user.ownedProjects,
      joinRequests: user.joinRequests,
      organizedEvents: user.organizedEvents,
      reviewsGiven: user.reviewsGiven,
      reviewsReceived: user.reviewsReceived,
      messagesSent: conversations.flatMap((c) => c.messages),
    };

    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="swiss-startup-hub-data-export.json"',
      },
    });
  } catch (error) {
    logger.error("Data export error", { error: String(error), userId });
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
