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
      const stars = "★".repeat(Number(rating) || 0) + "☆".repeat(5 - (Number(rating) || 0));
      await sendEmail({
        to: "henri@staehli.biz",
        subject: "Platform Review",
        text: `Rating: ${rating}/5 ${stars}\n\n${cleanReviewText || "(no additional comment)"}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
          <h2 style="margin-bottom:8px">Platform Review</h2>
          <p><strong>Rating:</strong> ${rating}/5 — ${stars}</p>
          ${cleanReviewText ? `<p><strong>Comment:</strong><br>${cleanReviewText.replace(/\n/g, "<br>")}</p>` : ""}
        </div>`,
      });
    } else if (type === "bug") {
      await sendEmail({
        to: "henri@staehli.biz",
        subject: "Bug Report",
        text: cleanIssueText || "(no description provided)",
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
          <h2 style="margin-bottom:8px">Bug Report</h2>
          <p>${(cleanIssueText || "(no description provided)").replace(/\n/g, "<br>")}</p>
        </div>`,
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Feedback email error", { error: String(error) });
    return NextResponse.json({ error: "Failed to send feedback" }, { status: 500 });
  }
}
