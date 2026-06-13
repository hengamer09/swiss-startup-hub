import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { maskEmail } from "@/lib/securityLog";

// Fallback sender used if the configured SMTP_FROM is rejected (e.g. unverified
// domain in Brevo). Domain swiss-startup-hub.ch is the project's own domain.
const FALLBACK_FROM = "noreply@swiss-startup-hub.ch";

// Cost protection: hard cap on total automated emails per rolling 24h window.
// In-memory only — resets on redeploy and is per serverless instance.
const MAX_EMAILS_PER_DAY = 250;
const DAY_MS = 24 * 60 * 60 * 1000;
let emailsSent = 0;
let windowResetAt = Date.now() + DAY_MS;

function underDailyCap(): boolean {
  const now = Date.now();
  if (now > windowResetAt) {
    emailsSent = 0;
    windowResetAt = now + DAY_MS;
  }
  return emailsSent < MAX_EMAILS_PER_DAY;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  type = "transactional",
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  type?: string;
}): Promise<boolean> {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn("SMTP not configured — email not sent", { to: maskEmail(to), subject });
    return false;
  }

  if (!underDailyCap()) {
    logger.error("Daily email cap reached — email not sent", {
      to: maskEmail(to),
      type,
      cap: MAX_EMAILS_PER_DAY,
    });
    return false;
  }
  emailsSent++;

  const transporter = nodemailer.createTransport({
    host,
    port: Number(env.SMTP_PORT),
    secure: false,
    auth: { user, pass },
  });

  const primaryFrom = env.SMTP_FROM || user;

  async function attempt(from: string): Promise<boolean> {
    await transporter.sendMail({ from, to, subject, text, html });
    return true;
  }

  try {
    const ok = await attempt(primaryFrom);
    logger.info("Email sent", { to: maskEmail(to), type, at: new Date().toISOString() });
    return ok;
  } catch (err) {
    logger.error("Email send failed — retrying with fallback sender", {
      to: maskEmail(to),
      subject,
      from: primaryFrom,
      error: String(err),
    });
    if (primaryFrom !== FALLBACK_FROM) {
      try {
        const ok = await attempt(FALLBACK_FROM);
        logger.info("Email sent (fallback sender)", { to: maskEmail(to), type });
        return ok;
      } catch (retryErr) {
        logger.error("Email send failed after fallback sender", {
          to: maskEmail(to),
          subject,
          error: String(retryErr),
        });
      }
    }
    return false;
  }
}
