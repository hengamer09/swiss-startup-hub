import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Public: list available mentors. Optional ?style= and ?location= filters.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const style = searchParams.get("style") || "";
  const location = searchParams.get("location") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 24;

  try {
    const where: Record<string, unknown> = {
      availableForMentoring: true,
      roles: { contains: "MENTOR" },
    };
    if (style) where.mentoringStyle = style;
    if (location) where.location = { contains: location };

    const [mentors, total] = await Promise.all([
      prisma.user.findMany({
        where: where as never,
        orderBy: { averageRating: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, name: true, image: true, location: true, mentoringStyle: true,
          mentorBio: true, averageRating: true,
          skills: { include: { skill: true }, take: 6 },
        },
      }),
      prisma.user.count({ where: where as never }),
    ]);

    return NextResponse.json({ mentors, total, page, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    logger.error("List mentors error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load mentors" }, { status: 500 });
  }
}
