import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ConversationThread from "./ConversationThread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, participants: { some: { userId: session.user.id } } },
    select: { id: true },
  });

  if (!conversation) redirect("/messages");

  return <ConversationThread conversationId={id} userId={session.user.id} />;
}
