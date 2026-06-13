import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSecurityCounts, logSecurityEvent } from "@/lib/securityLog";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    logSecurityEvent("admin_unauthorized", { route: "backup-stats", userId: session?.user?.id });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      users, verifiedUsers, projects, projectsByStage, events, upcomingEvents,
      messages, conversations, groupConversations, subscribed, unsubscribed,
      bookmarks, joinByStatus, newSignups24h, unverifiedOld, pendingReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.project.count(),
      prisma.project.groupBy({ by: ["stage"], _count: { _all: true } }),
      prisma.event.count(),
      prisma.event.count({ where: { date: { gte: now } } }),
      prisma.message.count(),
      prisma.conversation.count(),
      prisma.conversation.count({ where: { isGroup: true } }),
      prisma.emailSubscription.count({ where: { subscribed: true } }),
      prisma.emailSubscription.count({ where: { subscribed: false } }),
      prisma.bookmark.count(),
      prisma.joinRequest.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.user.count({ where: { emailVerified: false, createdAt: { lt: weekAgo } } }),
      prisma.report.count(),
    ]);

    const byStage: Record<string, number> = { IDEA: 0, MVP: 0, EARLY_REVENUE: 0, SCALING: 0, LAUNCHED: 0 };
    for (const g of projectsByStage) byStage[g.stage] = g._count._all;

    const joinCounts: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const g of joinByStatus) joinCounts[g.status] = g._count._all;

    // Warn on tables approaching scale.
    const warnings: string[] = [];
    if (users > 10000) warnings.push("Users table exceeds 10,000 rows");
    if (messages > 10000) warnings.push("Messages table exceeds 10,000 rows");
    if (projects > 10000) warnings.push("Projects table exceeds 10,000 rows");

    const security = getSecurityCounts();

    return NextResponse.json({
      users: { total: users, verified: verifiedUsers, unverified: users - verifiedUsers },
      projects: { total: projects, byStage },
      events: { total: events, upcoming: upcomingEvents, past: events - upcomingEvents },
      messages: { total: messages },
      conversations: { total: conversations, groups: groupConversations },
      emailSubscribers: { subscribed, unsubscribed },
      bookmarks: { total: bookmarks },
      joinRequests: { pending: joinCounts.PENDING, accepted: joinCounts.APPROVED, declined: joinCounts.REJECTED },
      blobStorage: { note: "Check Vercel dashboard for usage" },
      security: {
        failedLoginAttempts24h: security.failed_login || 0,
        rateLimitHits24h: security.rate_limit_abuse || 0,
        idorAttempts24h: security.idor_attempt || 0,
        adminUnauthorized24h: security.admin_unauthorized || 0,
        pendingReports,
      },
      activity: {
        newSignups24h,
        unverifiedAccountsOlderThan7d: unverifiedOld,
      },
      warnings,
    });
  } catch (error) {
    logger.error("Backup stats error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
