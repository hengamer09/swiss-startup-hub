import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseRolesNeeded } from "@/lib/utils";
import ProjectDetail from "./ProjectDetail";

export default async function ProjectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string })?.id || null;
  const userName = session?.user?.name || null;

  const [project, myRequest, approvedRequests, updatesRaw, myInterest] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        school: { select: { id: true, name: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, image: true, identityVerified: true, isStudent: true, roles: true, availableForMentoring: true },
            },
          },
        },
        openRoles: true,
        faqs: { orderBy: { order: "asc" } },
        _count: { select: { followers: true, members: true, updates: true, posts: true } },
        // Fetch pending requests for the founder
        joinRequests: {
          where: { status: "PENDING" },
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    userId
      ? prisma.joinRequest.findFirst({
          where: { userId, projectId: id },
          select: { id: true, status: true },
        })
      : Promise.resolve(null),
    prisma.joinRequest.findMany({
      where: { projectId: id, status: "APPROVED" },
      select: { userId: true, applicantRole: true },
    }),
    prisma.projectUpdate.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      take: 11,
      include: { author: { select: { id: true, name: true, image: true } } },
    }),
    userId
      ? prisma.projectInterest.findFirst({ where: { userId, projectId: id }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  if (!project) notFound();

  // Only expose pending requests to the project owner
  const isOwner = userId === project.ownerId;
  const { joinRequests, ...projectWithoutRequests } = project;
  const pendingRequests = isOwner ? joinRequests : [];

  // Owner-only: people who expressed interest.
  const interests = isOwner
    ? await prisma.projectInterest.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: {
            select: {
              id: true, name: true, image: true, roles: true,
              skills: { include: { skill: true }, take: 5 },
            },
          },
        },
      })
    : [];

  const updates = updatesRaw.slice(0, 10);
  const updatesCursor = updatesRaw.length > 10 ? updatesRaw[9].id : null;

  const quality = {
    name: project.name,
    problem: project.problem,
    solution: project.solution,
    rolesCount: parseRolesNeeded(project.rolesNeeded).length,
    logo: project.logo,
    stage: project.stage,
    memberCount: project._count.members,
    updateCount: project._count.updates,
    postCount: project._count.posts,
  };

  // Use applicantRole from the original join request as the canonical role display
  const roleByUser: Record<string, string> = {};
  for (const req of approvedRequests) {
    if (req.applicantRole) roleByUser[req.userId] = req.applicantRole;
  }
  const projectWithRoles = {
    ...projectWithoutRequests,
    members: projectWithoutRequests.members.map((m) => ({
      ...m,
      roleTitle: roleByUser[m.userId] || m.roleTitle,
    })),
  };

  const serialized = JSON.parse(
    JSON.stringify({ project: projectWithRoles, pendingRequests, myRequest, updates, interests, quality })
  );

  return (
    <ProjectDetail
      project={serialized.project}
      pendingRequests={serialized.pendingRequests}
      myRequest={serialized.myRequest}
      updates={serialized.updates}
      updatesCursor={updatesCursor}
      interests={serialized.interests}
      myInterest={Boolean(myInterest)}
      quality={serialized.quality}
      userId={userId}
      userName={userName}
    />
  );
}
