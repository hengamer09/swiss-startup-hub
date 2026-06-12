// Server-only — notifies users whose skills match a project's open roles.
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { skillMatchEmail } from "@/lib/emailTemplates";
import { findOrCreateConversation } from "@/lib/messaging";
import { checkRateLimit } from "@/lib/rateLimit";
import { parseRolesNeeded, APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";

const MAX_PER_PROJECT = 20;
const WEEKLY_LIMIT = 3;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface ProjectLike {
  id: string;
  name: string;
  ownerId: string;
  problem?: string | null;
  rolesNeeded?: string | null;
}

/**
 * Finds users whose skills match any role title in the project's rolesNeeded
 * and sends them a "someone needs your skill" notification (in-app message +
 * email). Skips the owner and existing team members. Best-effort; never throws.
 */
export async function notifyMatchingUsers(project: ProjectLike): Promise<void> {
  try {
    const roles = parseRolesNeeded(project.rolesNeeded);
    if (roles.length === 0) return;
    const roleTitles = roles.map((r) => r.title).filter(Boolean);
    if (roleTitles.length === 0) return;

    // Map a matching skill name -> the role title it matched (first wins).
    const allSkills = await prisma.skill.findMany({ select: { id: true, name: true } });
    const skillToRole = new Map<string, string>();
    const matchedSkillIds: string[] = [];
    for (const skill of allSkills) {
      const s = skill.name.toLowerCase();
      const role = roleTitles.find((t) => {
        const r = t.toLowerCase();
        return r.includes(s) || s.includes(r);
      });
      if (role) {
        skillToRole.set(skill.id, role);
        matchedSkillIds.push(skill.id);
      }
    }
    if (matchedSkillIds.length === 0) return;

    // Existing team members to exclude.
    const members = await prisma.projectMember.findMany({
      where: { projectId: project.id },
      select: { userId: true },
    });
    const excludeIds = new Set<string>([project.ownerId, ...members.map((m) => m.userId)]);

    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        skills: { some: { skillId: { in: matchedSkillIds } } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        skills: { where: { skillId: { in: matchedSkillIds } }, select: { skillId: true } },
      },
      take: MAX_PER_PROJECT,
    });

    const projectUrl = `${APP_URL}/projects/${project.id}`;
    const description = (project.problem || "").slice(0, 200);

    for (const user of candidates) {
      // Weekly cap per user.
      if (!checkRateLimit(`skillmatch:${user.id}`, WEEKLY_LIMIT, WEEK_MS)) continue;

      const matchedSkillId = user.skills[0]?.skillId;
      const roleTitle = matchedSkillId ? skillToRole.get(matchedSkillId) || roleTitles[0] : roleTitles[0];
      const matchedSkillName =
        allSkills.find((s) => s.id === matchedSkillId)?.name || roleTitle;

      try {
        const conversationId = await findOrCreateConversation(prisma, project.ownerId, user.id);
        await prisma.message.create({
          data: {
            conversationId,
            senderId: project.ownerId,
            receiverId: user.id,
            content: `🔍 ${project.name} is looking for a ${roleTitle} — your skills might be a match! View project: ${projectUrl}`,
            type: "BOT_NOTIFICATION",
            projectId: project.id,
          },
        });
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        if (user.email) {
          const { html, text } = skillMatchEmail(
            project.name,
            description,
            roleTitle,
            matchedSkillName,
            projectUrl
          );
          sendEmail({
            to: user.email,
            subject: `${project.name} is looking for a ${matchedSkillName} — Swiss Startup Hub`,
            text,
            html,
          }).catch((err) => logger.error("Skill-match email failed", { error: String(err) }));
        }
      } catch (err) {
        logger.error("Skill-match notify failed for user", { userId: user.id, error: String(err) });
      }
    }
  } catch (error) {
    logger.error("notifyMatchingUsers error", { projectId: project.id, error: String(error) });
  }
}
