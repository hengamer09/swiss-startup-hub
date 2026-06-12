// Server-only — reusable HTML email templates with a consistent look.
// Every template returns { html, text }; the caller sets the subject.
import { escapeHtml } from "@/lib/utils";

const RED = "#dc2626";

/** Wraps content in the standard Swiss Startup Hub email shell. */
function layout(contentHtml: string, unsubscribeUrl?: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <span style="font-size:20px;font-weight:700;color:${RED};">⛰ Swiss Startup Hub</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px 32px;color:#18181b;font-size:15px;line-height:1.6;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;line-height:1.5;">
              Swiss Startup Hub — Connecting the Swiss startup ecosystem.
              ${unsubscribeUrl ? `<br/><a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe from these emails</a>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Centered red call-to-action button. */
function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto;">
    <tr><td align="center" style="border-radius:8px;background:${RED};">
      <a href="${url}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${label}</a>
    </td></tr>
  </table>`;
}

export function verificationEmail(name: string, verifyUrl: string): { html: string; text: string } {
  const safeName = escapeHtml(name || "there");
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:20px;color:#18181b;">Welcome to Swiss Startup Hub!</h2>
    <p style="margin:0 0 8px 0;">Hi ${safeName},</p>
    <p style="margin:0 0 8px 0;">Please verify your email by clicking the button below. This link expires in 24 hours.</p>
    ${button("Verify my email", verifyUrl)}
    <p style="margin:8px 0 0 0;font-size:13px;color:#6b7280;">If the button doesn't work, copy and paste this link into your browser:<br/>
    <a href="${verifyUrl}" style="color:${RED};word-break:break-all;">${verifyUrl}</a></p>
  `;
  const text = `Welcome to Swiss Startup Hub!\n\nHi ${name || "there"},\n\nPlease verify your email by clicking the link below (expires in 24 hours):\n${verifyUrl}\n\nSwiss Startup Hub — Connecting the Swiss startup ecosystem.`;
  return { html: layout(content), text };
}

export function messageNotificationEmail(
  senderName: string,
  context: string | undefined,
  preview: string,
  conversationUrl: string,
  unsubscribeUrl?: string
): { html: string; text: string } {
  const safeSender = escapeHtml(senderName || "Someone");
  const safeContext = context ? escapeHtml(context) : "";
  const safePreview = escapeHtml(preview);
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:20px;color:#18181b;">New message from ${safeSender}</h2>
    ${safeContext ? `<p style="margin:0 0 8px 0;"><strong>Regarding:</strong> ${safeContext}</p>` : ""}
    <blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;margin:12px 0;color:#374151;">${safePreview}</blockquote>
    ${button("View conversation", conversationUrl)}
    <p style="margin:8px 0 0 0;font-size:13px;color:#6b7280;">You received this email because you have an account on Swiss Startup Hub.</p>
  `;
  const text = `New message from ${senderName || "Someone"}\n${context ? `Regarding: ${context}\n` : ""}\n${preview}\n\nView conversation: ${conversationUrl}\n\nYou received this email because you have an account on Swiss Startup Hub.${unsubscribeUrl ? `\nUnsubscribe: ${unsubscribeUrl}` : ""}`;
  return { html: layout(content, unsubscribeUrl), text };
}

export function newsletterEmail(
  subject: string,
  htmlContent: string,
  unsubscribeUrl: string
): { html: string; text: string } {
  const content = `
    <h2 style="margin:0 0 16px 0;font-size:20px;color:#18181b;">${escapeHtml(subject)}</h2>
    <div>${htmlContent}</div>
  `;
  // Best-effort plain-text: strip tags from the provided HTML content.
  const text = `${subject}\n\n${htmlContent.replace(/<[^>]*>/g, "").trim()}\n\nUnsubscribe: ${unsubscribeUrl}`;
  return { html: layout(content, unsubscribeUrl), text };
}

export function feedbackConfirmationEmail(
  type: "review" | "bug",
  rating?: number,
  comment?: string
): { html: string; text: string } {
  if (type === "review") {
    const n = Math.min(Math.max(Number(rating) || 0, 0), 5);
    const stars = "★".repeat(n) + "☆".repeat(5 - n);
    const safeComment = comment ? escapeHtml(comment).replace(/\n/g, "<br>") : "<em>No comment provided</em>";
    const content = `
      <h2 style="margin:0 0 12px 0;font-size:20px;color:#18181b;">New Review</h2>
      <p style="margin:0 0 8px 0;"><strong>Rating:</strong> ${stars} (${n}/5)</p>
      <p style="margin:0 0 8px 0;"><strong>Comment:</strong><br/>${safeComment}</p>
    `;
    const text = `New Review\nRating: ${n}/5 ${stars}\n\n${comment || "No comment provided"}`;
    return { html: layout(content), text };
  }
  const safeComment = comment ? escapeHtml(comment).replace(/\n/g, "<br>") : "(no description provided)";
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:20px;color:#18181b;">Bug Report</h2>
    <p style="margin:0 0 8px 0;">${safeComment}</p>
  `;
  const text = `Bug Report\n\n${comment || "(no description provided)"}`;
  return { html: layout(content), text };
}
