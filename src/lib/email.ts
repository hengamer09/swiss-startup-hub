import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// Fallback sender used if the configured SMTP_FROM is rejected (e.g. unverified
// domain in Brevo). Domain swiss-startup-hub.ch is the project's own domain.
const FALLBACK_FROM = "noreply@swiss-startup-hub.ch";

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn("SMTP not configured — email not sent", { to, subject });
    return false;
  }

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
    return await attempt(primaryFrom);
  } catch (err) {
    logger.error("Email send failed — retrying with fallback sender", {
      to,
      subject,
      from: primaryFrom,
      error: String(err),
    });
    // Retry once with a different sender in case the primary "from" is rejected.
    if (primaryFrom !== FALLBACK_FROM) {
      try {
        return await attempt(FALLBACK_FROM);
      } catch (retryErr) {
        logger.error("Email send failed after fallback sender", {
          to,
          subject,
          from: FALLBACK_FROM,
          error: String(retryErr),
        });
      }
    }
    return false;
  }
}
