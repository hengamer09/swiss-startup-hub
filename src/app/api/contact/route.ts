import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { stripTags } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`contact:${ip}`, 3, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { name, email, message } = await request.json();

    const cleanName = stripTags(String(name || "").trim()).slice(0, 200);
    const cleanEmail = stripTags(String(email || "").trim()).slice(0, 200);
    const cleanMessage = stripTags(String(message || "").trim()).slice(0, 5000);

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    logger.info("Sending contact form email", { from: cleanEmail });
    const sent = await sendEmail({
      to: "henri@staehli.biz",
      subject: "Contact Form — Swiss Startup Hub",
      text: `From: ${cleanName} <${cleanEmail}>\n\n${cleanMessage}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
        <h2 style="margin-bottom:8px">Contact Form Submission</h2>
        <p><strong>Name:</strong> ${cleanName}</p>
        <p><strong>Email:</strong> ${cleanEmail}</p>
        <p><strong>Message:</strong><br>${cleanMessage.replace(/\n/g, "<br>")}</p>
      </div>`,
    });

    if (!sent) {
      logger.error("Contact form email not sent — SMTP not configured");
      return NextResponse.json({ error: "Email service unavailable" }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Contact form email error", { error: String(error) });
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
