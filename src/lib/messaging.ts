import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findOrCreateConversation(db: any, userId1: string, userId2: string): Promise<string> {
  const existing = await db.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: userId1 } } },
        { participants: { some: { userId: userId2 } } },
      ],
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await db.conversation.create({
    data: {
      participants: {
        create: [{ userId: userId1 }, { userId: userId2 }],
      },
    },
    select: { id: true },
  });
  return created.id;
}

export async function maybeSendMessageEmail({
  conversationId,
  recipientId,
  senderId,
  subject,
  previewText,
  context,
}: {
  conversationId: string;
  recipientId: string;
  senderId: string;
  subject: string;
  previewText: string;
  context?: string;
}) {
  if (recipientId === senderId) return;
  if (!checkRateLimit(`email:conv:${conversationId}`, 1, 5 * 60_000)) return;

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { email: true, name: true },
  });
  if (!recipient?.email) return;

  const preview = previewText.slice(0, 200) + (previewText.length > 200 ? "…" : "");
  const convUrl = `${APP_URL}/messages/${conversationId}`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#18181b;max-width:600px">
    <p>Hi ${recipient.name || "there"},</p>
    ${context ? `<p><strong>Regarding:</strong> ${context}</p>` : ""}
    <blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;margin:12px 0;color:#374151">${preview}</blockquote>
    <p><a href="${convUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">View conversation</a></p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
    <p style="font-size:12px;color:#9ca3af">You received this email because you have an account on Swiss Startup Hub. You can manage your notification preferences in your profile settings.</p>
  </div>`;
  const text = `${context ? `Regarding: ${context}\n\n` : ""}${preview}\n\nView conversation: ${convUrl}`;

  sendEmail({ to: recipient.email, subject, text, html })
    .catch((err) => logger.error("Message notification email failed", { error: String(err), conversationId }));
}
