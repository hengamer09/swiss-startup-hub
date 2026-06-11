import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { type, rating, reviewText, issueText } = await request.json();

    if (type === "review") {
      const stars = "★".repeat(Number(rating) || 0) + "☆".repeat(5 - (Number(rating) || 0));
      await sendEmail({
        to: "henri@staehli.biz",
        subject: "Platform Review",
        text: `Rating: ${rating}/5 ${stars}\n\n${reviewText || "(no additional comment)"}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
          <h2 style="margin-bottom:8px">Platform Review</h2>
          <p><strong>Rating:</strong> ${rating}/5 — ${stars}</p>
          ${reviewText ? `<p><strong>Comment:</strong><br>${reviewText.replace(/\n/g, "<br>")}</p>` : ""}
        </div>`,
      });
    } else if (type === "bug") {
      await sendEmail({
        to: "henri@staehli.biz",
        subject: "Bug Report",
        text: issueText || "(no description provided)",
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b">
          <h2 style="margin-bottom:8px">Bug Report</h2>
          <p>${(issueText || "(no description provided)").replace(/\n/g, "<br>")}</p>
        </div>`,
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback email error:", error);
    return NextResponse.json({ error: "Failed to send feedback" }, { status: 500 });
  }
}
