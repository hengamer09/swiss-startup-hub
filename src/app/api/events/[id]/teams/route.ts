import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Public: list registered teams (projects) for a pitch competition.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const teams = await prisma.eventTeam.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: {
        project: {
          select: {
            id: true, name: true, industry: true,
            school: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true } },
          },
        },
      },
    });
    return NextResponse.json({ teams });
  } catch (error) {
    logger.error("List event teams error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}

// Authenticated: register one of your projects as a team in the competition.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const { projectId } = await request.json();
    if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

    const [event, project] = await Promise.all([
      prisma.event.findUnique({ where: { id }, select: { id: true, isPitchCompetition: true } }),
      prisma.project.findUnique({ where: { id: projectId }, select: { id: true, ownerId: true } }),
    ]);
    if (!event || !event.isPitchCompetition) return NextResponse.json({ error: "Not a pitch competition" }, { status: 400 });
    if (!project || project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "You can only register your own project" }, { status: 403 });
    }

    await prisma.eventTeam.upsert({
      where: { eventId_projectId: { eventId: id, projectId } },
      update: {},
      create: { eventId: id, projectId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Register team error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to register team" }, { status: 500 });
  }
}
