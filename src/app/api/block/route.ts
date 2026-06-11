import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ blocked: [] });
  }

  try {
    const blocked = await prisma.blockedUser.findMany({
      where: { blockerId: session.user.id },
      include: {
        blocked: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ blocked });
  } catch {
    return NextResponse.json({ blocked: [] });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { blockedId, action } = await request.json();

    if (!blockedId || !["block", "unblock"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    if (blockedId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot block yourself" },
        { status: 400 }
      );
    }

    if (action === "block") {
      await prisma.blockedUser.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: session.user.id,
            blockedId,
          },
        },
        update: {},
        create: {
          blockerId: session.user.id,
          blockedId,
        },
      });
    } else {
      await prisma.blockedUser.deleteMany({
        where: {
          blockerId: session.user.id,
          blockedId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Block user error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to update block status" },
      { status: 500 }
    );
  }
}
