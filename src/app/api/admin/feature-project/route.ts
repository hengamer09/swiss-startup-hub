import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/securityLog";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    logSecurityEvent("admin_unauthorized", { route: "feature-project", userId: session?.user?.id });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { projectId, featured } = await request.json();
    if (!projectId || typeof projectId !== "string" || typeof featured !== "boolean") {
      return NextResponse.json({ error: "projectId and featured are required" }, { status: 400 });
    }
    await prisma.project.update({ where: { id: projectId }, data: { featured } });
    return NextResponse.json({ success: true, featured });
  } catch (error) {
    logger.error("Feature project error", { error: String(error) });
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// List all projects with their featured state (admin only).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    logSecurityEvent("admin_unauthorized", { route: "feature-project", userId: session?.user?.id });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const projects = await prisma.project.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 200,
      select: { id: true, name: true, industry: true, stage: true, featured: true },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    logger.error("List projects (admin) error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}
