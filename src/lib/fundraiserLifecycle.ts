// Server-only — fundraiser deadline auto-close + reminder emails (daily cron).
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { fundraiserClosedEmail, fundraiserDeadlineEmail } from "@/lib/emailTemplates";
import { APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";

const DAY = 24 * 60 * 60 * 1000;

export async function runFundraiserDeadlines(): Promise<{ closed: number; reminded: number }> {
  const now = new Date();
  let closed = 0;
  let reminded = 0;

  // Fetch active fundraisers ending within ~4 days (covers expired + upcoming reminders).
  const fundraisers = await prisma.fundraiser.findMany({
    where: { isActive: true, deadline: { lte: new Date(now.getTime() + 4 * DAY) } },
    take: 500,
    include: {
      project: { select: { id: true, name: true, owner: { select: { name: true, email: true } } } },
      _count: { select: { pledges: true } },
    },
  });

  for (const f of fundraisers) {
    const url = `${APP_URL}/projects/${f.project.id}`;
    const ownerEmail = f.project.owner?.email;
    const ownerName = f.project.owner?.name || "there";

    if (f.deadline <= now) {
      // Auto-close
      try {
        await prisma.fundraiser.update({
          where: { id: f.id },
          data: { isActive: false, closedAt: now, closedBy: "auto" },
        });
        logger.info("Fundraiser auto-closed at deadline", { projectName: f.project.name });
        if (ownerEmail) {
          const { html, text } = fundraiserClosedEmail(ownerName, f.project.name, f.currentAmount, f._count.pledges, f.goal, url);
          const ok = await sendEmail({
            to: ownerEmail,
            subject: `Your fundraiser for ${f.project.name} has closed`,
            text, html, type: "fundraiser_closed",
          });
          if (ok) closed++;
        } else {
          closed++;
        }
      } catch (err) {
        logger.error("Fundraiser auto-close failed", { id: f.id, error: String(err) });
      }
    } else {
      // Deadline reminder at 3 days and 1 day out.
      const daysLeft = Math.ceil((f.deadline.getTime() - now.getTime()) / DAY);
      if ((daysLeft === 3 || daysLeft === 1) && ownerEmail) {
        const { html, text } = fundraiserDeadlineEmail(ownerName, f.project.name, daysLeft, url);
        const ok = await sendEmail({
          to: ownerEmail,
          subject: daysLeft <= 1 ? `Last 24 hours to pledge for ${f.project.name}` : `${f.project.name} fundraiser closes in 3 days`,
          text, html, type: "fundraiser_deadline",
        });
        if (ok) reminded++;
      }
    }
  }

  logger.info("Fundraiser deadlines processed", { closed, reminded, scanned: fundraisers.length });
  return { closed, reminded };
}
