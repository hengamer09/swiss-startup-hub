import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProjectDetail from "./ProjectDetail";

export default async function ProjectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string })?.id || null;
  const userName = session?.user?.name || null;

  const [project, myRequest, approvedRequests] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, image: true, identityVerified: true },
            },
          },
        },
        openRoles: true,
        faqs: { orderBy: { order: "asc" } },
        _count: { select: { followers: true } },
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
  ]);

  if (!project) notFound();

  // Only expose pending requests to the project owner
  const isOwner = userId === project.ownerId;
  const { joinRequests, ...projectWithoutRequests } = project;
  const pendingRequests = isOwner ? joinRequests : [];

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
    JSON.stringify({ project: projectWithRoles, pendingRequests, myRequest })
  );

  return (
    <ProjectDetail
      project={serialized.project}
      pendingRequests={serialized.pendingRequests}
      myRequest={serialized.myRequest}
      userId={userId}
      userName={userName}
    />
  );
}
