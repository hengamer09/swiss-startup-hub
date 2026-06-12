import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { stripTags } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`feedback:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { type, rating, reviewText, issueText } = await request.json();

    const cleanReviewText = reviewText ? stripTags(String(reviewText).trim()).slice(0, 2000) : "";
    const cleanIssueText = issueText ? stripTags(String(issueText).trim()).slice(0, 5000) : "";

    if (type === "review") {
      const n = Math.min(Math.max(Number(rating) || 0, 0), 5);
      const stars = "★".repeat(n) + "☆".repeat(5 - n);
      const commentText = cleanReviewText || "No comment provided";
      logger.info("Sending review feedback email", { rating: n });
      const sent = await sendEmail({
        to: "henri@staehli.biz",
        subject: "New Review — Swiss Startup Hub",
        text: `Rating: ${n}/5 ${stars}\n\n${commentText}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
          <h2 style="margin-bottom:8px">Platform Review</h2>
          <p><strong>Rating:</strong> ${stars} (${n}/5)</p>
          <p><strong>Comment:</strong><br>${
            cleanReviewText
              ? cleanReviewText.replace(/\n/g, "<br>")
              : "<em>No comment provided</em>"
          }</p>
        </div>`,
      });
      if (!sent) {
        logger.error("Feedback review email not sent — SMTP not configured");
        return NextResponse.json({ error: "Email service unavailable" }, { status: 503 });
      }
    } else if (type === "bug") {
      const bodyText = cleanIssueText || "(no description provided)";
      logger.info("Sending bug report feedback email");
      const sent = await sendEmail({
        to: "henri@staehli.biz",
        subject: "Bug Report — Swiss Startup Hub",
        text: bodyText,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
          <h2 style="margin-bottom:8px">Bug Report</h2>
          <p>${bodyText.replace(/\n/g, "<br>")}</p>
        </div>`,
      });
      if (!sent) {
        logger.error("Feedback bug report email not sent — SMTP not configured");
        return NextResponse.json({ error: "Email service unavailable" }, { status: 503 });
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Feedback email error", { error: String(error) });
    return NextResponse.json({ error: "Failed to send feedback" }, { status: 500 });
  }
}
