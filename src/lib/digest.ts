// Server-only — weekly digest sender shared by the admin and cron routes.
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { weeklyDigestEmail } from "@/lib/emailTemplates";
import { makeUnsubscribeToken } from "@/lib/emailTokens";
import { parseRolesNeeded, formatStage, APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";

/* eslint-disable @typescript-eslint/no-explicit-any */

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function projectDescription(p: any): string {
  return (p.problem || p.solution || "").slice(0, 50);
}

function projectRolesLabel(p: any): string {
  return parseRolesNeeded(p.rolesNeeded).map((r) => r.title).slice(0, 3).join(", ");
}

function matchesUserSkills(p: any, skills: string[]): boolean {
  if (skills.length === 0) return false;
  const haystacks = [
    (p.industry || "").toLowerCase(),
    ...parseRolesNeeded(p.rolesNeeded).map((r) => r.title.toLowerCase()),
  ];
  return skills.some((s) => {
    const sl = s.toLowerCase();
    return haystacks.some((h) => h.includes(sl) || sl.includes(h));
  });
}

export async function runWeeklyDigest(): Promise<{ sent: number; failed: number; skipped: number }> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentProjects = await prisma.project.findMany({
    where: { createdAt: { gte: weekAgo } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, name: true, problem: true, solution: true,
      stage: true, rolesNeeded: true, industry: true,
    },
  });
  // Fallback list: 5 newest projects overall.
  const newestProjects = recentProjects.slice(0, 5);

  const subscribers = await prisma.emailSubscription.findMany({
    where: { subscribed: true },
    select: {
      email: true,
      user: {
        select: { name: true, skills: { select: { skill: { select: { name: true } } } } },
      },
    },
  });

  const exploreUrl = `${APP_URL}/feed`;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (sub) => {
        const skills = (sub.user?.skills || []).map((s) => s.skill.name);
        let matches = recentProjects.filter((p) => matchesUserSkills(p, skills)).slice(0, 5);
        if (matches.length === 0) matches = newestProjects;
        if (matches.length === 0) return "skip";

        const projects = matches.map((p) => ({
          name: p.name,
          description: projectDescription(p),
          stage: formatStage(p.stage),
          roles: projectRolesLabel(p),
          url: `${APP_URL}/projects/${p.id}`,
        }));
        const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${makeUnsubscribeToken(sub.email)}`;
        const { html, text } = weeklyDigestEmail(
          sub.user?.name || "there",
          projects,
          exploreUrl,
          unsubscribeUrl
        );
        return sendEmail({
          to: sub.email,
          subject: "Your weekly update — Swiss Startup Hub",
          text,
          html,
        });
      })
    );
    for (const r of results) {
      if (r === "skip") skipped++;
      else if (r) sent++;
      else failed++;
    }
    if (i + BATCH_SIZE < subscribers.length) await sleep(BATCH_DELAY_MS);
  }

  logger.info("Weekly digest sent", { sent, failed, skipped });
  return { sent, failed, skipped };
}
