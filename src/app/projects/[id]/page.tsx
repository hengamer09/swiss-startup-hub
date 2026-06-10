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

  const [project, myRequest] = await Promise.all([
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
  ]);

  if (!project) notFound();

  // Only expose pending requests to the project owner
  const isOwner = userId === project.ownerId;
  const { joinRequests, ...projectWithoutRequests } = project;
  const pendingRequests = isOwner ? joinRequests : [];

  const serialized = JSON.parse(
    JSON.stringify({ project: projectWithoutRequests, pendingRequests, myRequest })
  );

  return (
    <ProjectDetail
      project={serialized.project}
      pendingRequests={serialized.pendingRequests}
      myRequest={serialized.myRequest}
      userId={userId}
    />
  );
}
