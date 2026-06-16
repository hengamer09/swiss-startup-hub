import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { logSecurityEvent } from "@/lib/securityLog";
import { logger } from "@/lib/logger";
import { APP_URL } from "@/lib/utils";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

// Approve or reject a project's request to be affiliated with this school.
// Allowed for the platform admin or a school ADMIN/TEACHER of this school.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: schoolId, projectId } = await params;
  const userId = session.user.id;

  const isPlatformAdmin = session.user.email === ADMIN_EMAIL;
  if (!isPlatformAdmin) {
    const membership = await prisma.schoolMembership.findFirst({
      where: { schoolId, userId, role: { in: ["ADMIN", "TEACHER"] } },
      select: { id: true },
    });
    if (!membership) {
      logSecurityEvent("admin_unauthorized", { route: "affiliation", schoolId, userId });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let action: string;
  try {
    action = String((await request.json())?.action || "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, schoolId },
      select: {
        id: true, name: true, schoolAffiliation: true,
        owner: { select: { name: true, email: true } },
        school: { select: { name: true } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Affiliation request not found" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.project.update({
        where: { id: projectId },
        data: { schoolAffiliation: "APPROVED", schoolApprovedAt: new Date(), schoolApprovedBy: userId },
      });
      if (project.owner?.email) {
        sendEmail({
          to: project.owner.email,
          subject: `Your project is now an official ${project.school?.name} project`,
          text: `Great news! ${project.school?.name} has approved "${project.name}" as an official school project.\n\nThis unlocks a verified school badge on your project, access to your school's community, and school-specific mentors and events.\n\nView your project: ${APP_URL}/projects/${project.id}`,
          type: "school_affiliation_approved",
        }).catch((err) => logger.error("Affiliation approve email failed", { error: String(err) }));
      }
    } else {
      await prisma.project.update({
        where: { id: projectId },
        data: { schoolAffiliation: "REJECTED", schoolApprovedAt: null, schoolApprovedBy: null },
      });
      if (project.owner?.email) {
        sendEmail({
          to: project.owner.email,
          subject: `Update on your ${project.school?.name} affiliation request`,
          text: `${project.school?.name} reviewed your request to affiliate "${project.name}" and was not able to approve it this time.\n\nYou can update your project and request again from the project's edit page.\n\nView your project: ${APP_URL}/projects/${project.id}`,
          type: "school_affiliation_rejected",
        }).catch((err) => logger.error("Affiliation reject email failed", { error: String(err) }));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Affiliation action error", { schoolId, projectId, error: String(error) });
    return NextResponse.json({ error: "Failed to update affiliation" }, { status: 500 });
  }
}
