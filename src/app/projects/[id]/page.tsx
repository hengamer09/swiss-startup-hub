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

  const project = await prisma.project.findUnique({
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
    },
  });

  if (!project) notFound();

  const serialized = JSON.parse(JSON.stringify(project));

  return (
    <ProjectDetail
      project={serialized}
      userId={(session?.user as { id: string })?.id || null}
    />
  );
}
