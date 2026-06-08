import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProfileContent from "./ProfileContent";

export default async function UserProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      skills: { include: { skill: true } },
      memberships: {
        include: { project: { select: { id: true, name: true } } },
        take: 10,
      },
      _count: {
        select: { memberships: true },
      },
    },
  });

  if (!user) notFound();

  const serialized = JSON.parse(JSON.stringify(user));

  // fetch events created and attending
  const createdEvents = await prisma.event.findMany({ where: { organizerId: id }, orderBy: { date: 'desc' } });
  const attending = await prisma.eventAttendee.findMany({ where: { userId: id }, include: { event: true } });

  const createdEventsSerialized = JSON.parse(JSON.stringify(createdEvents));
  const attendingSerialized = JSON.parse(JSON.stringify(attending));

  return (
    <ProfileContent
      user={serialized}
      isOwnProfile={!!(session?.user && session.user.id === id)}
      currentUserId={session?.user?.id || null}
      createdEvents={createdEventsSerialized}
      attendingEvents={attendingSerialized}
    />
  );
}
