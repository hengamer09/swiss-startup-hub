import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Owner: list all vouchers for the project's fundraiser (pending + redeemed).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const fundraiser = await prisma.fundraiser.findUnique({
      where: { projectId: id },
      select: { id: true, project: { select: { ownerId: true } } },
    });
    if (!fundraiser) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (fundraiser.project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vouchers = await prisma.voucher.findMany({
      where: { fundraiserId: fundraiser.id },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        reward: { select: { title: true } },
        pledge: { select: { name: true, createdAt: true } },
      },
    });
    return NextResponse.json({ vouchers });
  } catch (error) {
    logger.error("List vouchers error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to load vouchers" }, { status: 500 });
  }
}
