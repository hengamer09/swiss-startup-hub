import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { logSecurityEvent } from "@/lib/securityLog";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    logSecurityEvent("admin_unauthorized", { route: "admin/schools/verify", userId: session?.user?.id });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const school = await prisma.school.update({
      where: { id },
      data: { verified: true, verifiedAt: new Date() },
      select: { name: true, contactEmail: true },
    });
    if (school.contactEmail) {
      sendEmail({
        to: school.contactEmail,
        subject: `Your school has been verified — Swiss Startup Hub`,
        text: `Good news! Your school "${school.name}" has been verified. Your students can now join and create projects under ${school.name}.`,
        type: "school_verified",
      }).catch((err) => logger.error("School verify email failed", { error: String(err) }));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Verify school error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to verify school" }, { status: 500 });
  }
}
