import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRoles } from "@/lib/utils";
import FeedContent from "./FeedContent";

export const metadata = { title: "Feed — Swiss Startup Hub" };

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, image: true, bio: true, emailVerified: true, roles: true,
      portfolioUrl: true, websiteUrl: true, githubUrl: true, linkedinUrl: true, portfolio: true,
      _count: { select: { skills: true } },
    },
  });

  const completeness = {
    name: user?.name,
    emailVerified: user?.emailVerified,
    image: user?.image,
    bio: user?.bio,
    skillsCount: user?._count?.skills ?? 0,
    rolesCount: parseRoles(user?.roles || "[]").length,
    portfolioUrl: user?.portfolioUrl,
    websiteUrl: user?.websiteUrl,
    githubUrl: user?.githubUrl,
    linkedinUrl: user?.linkedinUrl,
    portfolio: user?.portfolio,
  };

  return <FeedContent userId={session.user.id} completeness={completeness} />;
}
