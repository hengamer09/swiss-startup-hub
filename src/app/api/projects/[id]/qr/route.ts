import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { APP_URL } from "@/lib/utils";
import { logger } from "@/lib/logger";

// Public: returns a PNG QR code linking to the project page.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const url = `${APP_URL}/projects/${id}`;
    const buffer = await QRCode.toBuffer(url, { width: 400, margin: 1 });
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="project-${id}-qr.png"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    logger.error("Project QR error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
