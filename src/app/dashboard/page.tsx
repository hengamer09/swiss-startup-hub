import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardContent from "./DashboardContent";

export const metadata = { title: "Dashboard — Swiss Startup Hub" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;

  const [user, followedProjects, myJoinRequests, hostedEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedProjects: {
          include: {
            joinRequests: {
              include: { user: { select: { id: true, name: true, image: true } } },
              orderBy: { createdAt: "desc" },
            },
            followers: {
              include: { user: { select: { id: true, name: true, image: true } } },
            },
            _count: { select: { joinRequests: true, followers: true, members: true } },
          },
        },
      },
    }),
    prisma.projectFollower.findMany({
      where: { userId },
      include: {
        project: {
          select: { id: true, name: true, industry: true, stage: true, location: true, followerCount: true },
        },
      },
      orderBy: { followedAt: "desc" },
    }),
    prisma.joinRequest.findMany({
      where: { userId },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findMany({
      where: { organizerId: userId },
      orderBy: { date: "asc" },
    }),
  ]);

  const serialized = JSON.parse(JSON.stringify({ user, followedProjects, myJoinRequests, hostedEvents }));

  return <DashboardContent data={serialized} />;
}
