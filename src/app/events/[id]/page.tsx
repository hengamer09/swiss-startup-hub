import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EventDetail from "./EventDetail";

export default async function EventPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  if (!event) notFound();

  const serialized = JSON.parse(JSON.stringify(event));

  return (
    <EventDetail event={serialized} userId={(session?.user as { id: string })?.id || null} />
  );
}
