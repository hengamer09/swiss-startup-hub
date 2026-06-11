import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { attendeeId } = await request.json();
    if (!attendeeId) {
      return NextResponse.json({ error: "Missing attendee" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.eventAttendee.delete({
      where: { id: attendeeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove registration error:", error);
    return NextResponse.json({ error: "Failed to remove attendee" }, { status: 500 });
  }
}
