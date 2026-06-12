import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { messageNotificationEmail } from "@/lib/emailTemplates";
import { makeUnsubscribeToken } from "@/lib/emailTokens";
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

  const [recipient, sender] = await Promise.all([
    prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, name: true },
    }),
    prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true },
    }),
  ]);
  if (!recipient?.email) return;

  const preview = previewText.slice(0, 200) + (previewText.length > 200 ? "…" : "");
  const convUrl = `${APP_URL}/messages/${conversationId}`;
  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${makeUnsubscribeToken(recipient.email)}`;
  const { html, text } = messageNotificationEmail(
    sender?.name || "Someone",
    context,
    preview,
    convUrl,
    unsubscribeUrl
  );

  sendEmail({ to: recipient.email, subject, text, html })
    .catch((err) => logger.error("Message notification email failed", { error: String(err), conversationId }));
}
