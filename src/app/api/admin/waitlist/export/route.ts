import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/securityLog";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";

// Escape a value for CSV (wrap in quotes, double internal quotes).
function csv(value: unknown): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    logSecurityEvent("admin_unauthorized", { route: "waitlist/export", userId: session?.user?.id });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const entries = await prisma.waitlistEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    const header = ["Name", "Email", "Role", "Message", "Signed Up Date"];
    const rows = entries.map((e) =>
      [csv(e.name), csv(e.email), csv(e.role), csv(e.message || ""), csv(new Date(e.createdAt).toISOString())].join(",")
    );
    const content = [header.map(csv).join(","), ...rows].join("\r\n");
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="swiss-startup-hub-waitlist-${date}.csv"`,
      },
    });
  } catch (error) {
    logger.error("Waitlist export error", { error: String(error) });
    return NextResponse.json({ error: "Failed to export waitlist" }, { status: 500 });
  }
}
