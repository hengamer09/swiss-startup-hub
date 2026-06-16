import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { stripTags } from "@/lib/utils";
import { logSecurityEvent } from "@/lib/securityLog";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    logSecurityEvent("admin_unauthorized", { route: "admin/schools/reject", userId: session?.user?.id });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const reason = body.reason ? stripTags(String(body.reason).trim()).slice(0, 500) : "";

    const school = await prisma.school.findUnique({
      where: { id },
      select: { name: true, contactEmail: true },
    });
    if (!school) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (school.contactEmail) {
      sendEmail({
        to: school.contactEmail,
        subject: `Update on your school registration — Swiss Startup Hub`,
        text: `Thank you for registering "${school.name}". Unfortunately we couldn't verify it at this time.${reason ? `\n\nReason: ${reason}` : ""}\n\nPlease reply to this email if you'd like to provide more information.`,
        type: "school_rejected",
      }).catch((err) => logger.error("School reject email failed", { error: String(err) }));
    }

    await prisma.school.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Reject school error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to reject school" }, { status: 500 });
  }
}
