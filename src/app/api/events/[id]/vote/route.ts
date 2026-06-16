import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

// Authenticated: cast one vote per user per event for a project.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(`vote:${session.user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  try {
    const { projectId } = await request.json();
    if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id }, select: { votingClosed: true } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (event.votingClosed) return NextResponse.json({ error: "Voting is closed" }, { status: 400 });

    const existing = await prisma.eventVote.findUnique({
      where: { eventId_voterId: { eventId: id, voterId: session.user.id } },
      select: { id: true },
    });
    if (existing) {
      await prisma.eventVote.update({ where: { id: existing.id }, data: { projectId } });
    } else {
      await prisma.eventVote.create({ data: { eventId: id, voterId: session.user.id, projectId } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Vote error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
