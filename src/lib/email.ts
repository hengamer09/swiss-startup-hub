import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

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
}) {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn("SMTP not configured — email not sent");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(env.SMTP_PORT),
    secure: false,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: env.SMTP_FROM || user,
    to,
    subject,
    text,
    html,
  });

  return true;
}
