import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// `id` may be either a bookmark id (dashboard) or a projectId (card toggle).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const result = await prisma.bookmark.deleteMany({
      where: {
        userId: session.user.id,
        OR: [{ id }, { projectId: id }],
      },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete bookmark error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
  }
}
