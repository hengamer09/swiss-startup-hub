import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const badges: string[] = [];
    const updates: Record<string, unknown> = {};

    if (user.isEarlyMember) badges.push("EARLY_MEMBER");
    if (user.identityVerified) badges.push("VERIFIED");

    if (user.averageRating >= 4.5 && user.ratingCount >= 3) {
      badges.push("TOP_RATED");
    }

    const memberCount = user._count?.memberships || 0;
    if (memberCount >= 3) {
      badges.push("ACTIVE_CONTRIBUTOR");
    }

    return NextResponse.json({ badges, memberCount });
  } catch (error) {
    console.error("Badge check error:", error);
    return NextResponse.json(
      { error: "Failed to check badges" },
      { status: 500 }
    );
  }
}
