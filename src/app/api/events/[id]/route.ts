import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true } },
        attendees: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!event) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Get event error:", error);
    return NextResponse.json({ message: "Failed to load event" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = params;
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (event.organizerId !== session.user.id) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json({ message: "Failed to delete event" }, { status: 500 });
  }
}
