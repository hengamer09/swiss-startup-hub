import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripTags, APP_URL } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { waitlistConfirmationEmail, waitlistNotificationEmail } from "@/lib/emailTemplates";
import { logger } from "@/lib/logger";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ["FOUNDER", "PROFESSIONAL", "INVESTOR"];
const ADMIN_EMAIL = "swissstartuphub@gmail.com";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`waitlist:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const name = stripTags(String(body.name || "").trim()).slice(0, 100);
    const email = stripTags(String(body.email || "").trim()).toLowerCase().slice(0, 255);
    const role = String(body.role || "").trim();
    const message = body.message ? stripTags(String(body.message).trim()).slice(0, 500) : null;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    if (!ROLES.includes(role)) return NextResponse.json({ error: "Please select a valid role" }, { status: 400 });

    const existing = await prisma.waitlistEntry.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "already_registered" }, { status: 409 });
    }

    await prisma.waitlistEntry.create({ data: { name, email, role, message } });

    // Confirmation email to the user (fire-and-forget).
    const confirm = waitlistConfirmationEmail(name, role, APP_URL);
    sendEmail({
      to: email,
      subject: "You're on the Swiss Startup Hub waitlist! 🚀",
      text: confirm.text,
      html: confirm.html,
      type: "waitlist",
    }).catch((err) => logger.error("Waitlist confirmation email failed", { error: String(err) }));

    // Notification email to admin (fire-and-forget).
    const notify = waitlistNotificationEmail(name, email, role, message);
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `New waitlist signup — ${name} (${role})`,
      text: notify.text,
      html: notify.html,
      type: "waitlist_admin",
    }).catch((err) => logger.error("Waitlist notification email failed", { error: String(err) }));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Waitlist signup error", { error: String(error) });
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
