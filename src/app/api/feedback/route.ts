import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { feedbackConfirmationEmail } from "@/lib/emailTemplates";
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
      logger.info("Sending review feedback email", { rating: n });
      const { html, text } = feedbackConfirmationEmail("review", n, cleanReviewText);
      const sent = await sendEmail({
        to: "henri@staehli.biz",
        subject: "New Review — Swiss Startup Hub",
        text,
        html,
      });
      if (!sent) {
        logger.error("Feedback review email not sent");
        return NextResponse.json({ error: "Email service unavailable" }, { status: 503 });
      }
    } else if (type === "bug") {
      logger.info("Sending bug report feedback email");
      const { html, text } = feedbackConfirmationEmail("bug", undefined, cleanIssueText);
      const sent = await sendEmail({
        to: "henri@staehli.biz",
        subject: "Bug Report — Swiss Startup Hub",
        text,
        html,
      });
      if (!sent) {
        logger.error("Feedback bug report email not sent");
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
