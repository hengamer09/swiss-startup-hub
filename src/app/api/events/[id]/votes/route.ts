import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Public: vote counts per project for an event (leaderboard). Includes the
// caller's own vote when authenticated.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    let myVote: string | null = null;
    if (session?.user) {
      const v = await prisma.eventVote.findUnique({
        where: { eventId_voterId: { eventId: id, voterId: session.user.id } },
        select: { projectId: true },
      });
      myVote = v?.projectId ?? null;
    }
    const grouped = await prisma.eventVote.groupBy({
      by: ["projectId"],
      where: { eventId: id },
      _count: { _all: true },
    });
    const projectIds = grouped.map((g) => g.projectId);
    const projects = projectIds.length
      ? await prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } })
      : [];
    const nameById = Object.fromEntries(projects.map((p) => [p.id, p.name]));

    const event = await prisma.event.findUnique({ where: { id }, select: { votingClosed: true } });

    const results = grouped
      .map((g) => ({ projectId: g.projectId, name: nameById[g.projectId] || "Project", votes: g._count._all }))
      .sort((a, b) => b.votes - a.votes);

    return NextResponse.json({ results, votingClosed: event?.votingClosed ?? false, myVote });
  } catch (error) {
    logger.error("Votes error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load votes" }, { status: 500 });
  }
}
