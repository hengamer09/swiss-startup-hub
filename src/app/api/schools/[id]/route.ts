import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Public: verified school detail with members and projects.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        students: {
          take: 100,
          include: {
            user: {
              select: {
                id: true, name: true, image: true, roles: true,
                skills: { include: { skill: true }, take: 5 },
              },
            },
          },
        },
        projects: {
          take: 50,
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, industry: true, stage: true, problem: true, isStudentProject: true },
        },
      },
    });
    if (!school || !school.verified) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ school });
  } catch (error) {
    logger.error("Get school error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load school" }, { status: 500 });
  }
}
