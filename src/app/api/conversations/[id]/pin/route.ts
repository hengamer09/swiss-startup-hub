import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Toggle (or set) the pin state of a conversation for the current user.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;
  const userId = session.user.id;

  try {
    // Verify the user participates in this conversation.
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { id: true },
    });
    if (!participant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { pinnedByDefault: true, pins: { where: { userId }, select: { pinned: true } } },
    });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const currentlyPinned =
      conversation.pins.length > 0 ? conversation.pins[0].pinned : conversation.pinnedByDefault;
    const pinned = typeof body.pinned === "boolean" ? body.pinned : !currentlyPinned;

    await prisma.conversationPin.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: { pinned },
      create: { conversationId, userId, pinned },
    });

    return NextResponse.json({ pinned });
  } catch (error) {
    logger.error("Pin conversation error", { conversationId, error: String(error) });
    return NextResponse.json({ error: "Failed to update pin" }, { status: 500 });
  }
}
