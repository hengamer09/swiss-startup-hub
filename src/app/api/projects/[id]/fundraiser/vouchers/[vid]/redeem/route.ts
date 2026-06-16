import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";

// Owner: mark a voucher as redeemed.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; vid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, vid } = await params;
  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: vid },
      select: { id: true, fundraiser: { select: { projectId: true, project: { select: { ownerId: true } } } } },
    });
    if (!voucher || voucher.fundraiser.projectId !== id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (voucher.fundraiser.project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const usedBy = body.usedBy ? stripTags(String(body.usedBy).trim()).slice(0, 200) : null;
    const redeemedAt = body.redeemedAt ? new Date(body.redeemedAt) : new Date();

    await prisma.voucher.update({
      where: { id: vid },
      data: { usedAt: isNaN(redeemedAt.getTime()) ? new Date() : redeemedAt, usedBy },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Redeem voucher error", { id, vid, error: String(error) });
    return NextResponse.json({ error: "Failed to redeem voucher" }, { status: 500 });
  }
}
