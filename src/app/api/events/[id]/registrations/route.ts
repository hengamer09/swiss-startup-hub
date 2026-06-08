import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = params; // event id
  try {
    const { attendeeId, action } = await request.json(); // action: 'approve'|'reject'|'remove'
    if (!attendeeId || !action) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (event.organizerId !== session.user.id) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const ea = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
    if (!ea) return NextResponse.json({ message: "Attendee not found" }, { status: 404 });

    if (action === "remove") {
      await prisma.eventAttendee.delete({ where: { id: attendeeId } });
      return NextResponse.json({ message: "Removed" });
    }

    let intentionObj: any = {};
    try {
      intentionObj = JSON.parse(ea.intention || "{}");
    } catch {}

    if (action === "approve") intentionObj.status = "APPROVED";
    if (action === "reject") intentionObj.status = "REJECTED";

    await prisma.eventAttendee.update({ where: { id: attendeeId }, data: { intention: JSON.stringify(intentionObj) } });

    // notify user
    await prisma.notification.create({
      data: {
        userId: ea.userId,
        type: "event_registration_update",
        content: `Your registration for ${event.title} was ${intentionObj.status.toLowerCase()}`,
        link: `/events/${id}`,
      },
    });

    return NextResponse.json({ status: intentionObj.status });
  } catch (error) {
    console.error("Manage registration error:", error);
    return NextResponse.json({ message: "Failed to manage registration" }, { status: 500 });
  }
}
