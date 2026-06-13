import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { logSecurityEvent } from "@/lib/securityLog";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES_PER_USER = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Validate the real file content via magic bytes (not just the declared type).
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif";
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Max 10 uploads per minute per user.
  if (!checkRateLimit(`upload:${userId}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    logger.error("Upload attempted but BLOB_READ_WRITE_TOKEN is not configured");
    return NextResponse.json({ error: "Image upload is not configured" }, { status: 503 });
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 413 });
    }

    // Validate declared type AND actual content.
    const buffer = new Uint8Array(await file.arrayBuffer());
    const sniffed = sniffImageType(buffer);
    if (!ALLOWED_TYPES.includes(file.type) || !sniffed || !ALLOWED_TYPES.includes(sniffed)) {
      logSecurityEvent("bad_upload", { userId, declaredType: file.type, sniffed });
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP and GIF images are allowed." },
        { status: 400 }
      );
    }

    // Per-user storage cap: max 10 images.
    const prefix = `uploads/${userId}/`;
    const existing = await list({ prefix, token, limit: MAX_IMAGES_PER_USER + 1 });
    if (existing.blobs.length >= MAX_IMAGES_PER_USER) {
      return NextResponse.json(
        { error: "Upload limit reached (max 10 images). Please delete old images first." },
        { status: 400 }
      );
    }

    const safeName = (file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const blob = await put(`${prefix}${Date.now()}-${safeName}`, file, {
      access: "public",
      contentType: sniffed,
      token,
    });

    logger.info("Image uploaded", { userId, size: file.size, type: sniffed });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    logger.error("Upload error", { error: String(error) });
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
