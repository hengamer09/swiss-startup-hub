import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripTags, sanitizeUrl } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const ADMIN_EMAIL = "swissstartuphub@gmail.com";
const TYPES = ["GYMNASIUM", "BERUFSSCHULE", "UNIVERSITY", "ORGANIZATION"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public: list verified schools with counts.
export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      where: { verified: true },
      orderBy: { name: "asc" },
      take: 200,
      select: {
        id: true, name: true, type: true, canton: true, city: true, logo: true,
        _count: { select: { students: true, projects: true } },
      },
    });
    return NextResponse.json({ schools });
  } catch (error) {
    logger.error("List schools error", { error: String(error) });
    return NextResponse.json({ error: "Failed to load schools" }, { status: 500 });
  }
}

// Public: register a new (unverified) school.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`school-register:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const name = stripTags(String(body.name || "").trim()).slice(0, 200);
    const type = String(body.type || "");
    const canton = stripTags(String(body.canton || "").trim()).slice(0, 100);
    const city = stripTags(String(body.city || "").trim()).slice(0, 100);
    const contactName = stripTags(String(body.contactName || "").trim()).slice(0, 100);
    const contactEmail = stripTags(String(body.contactEmail || "").trim()).slice(0, 255);
    const website = body.website ? sanitizeUrl(body.website) : null;
    const description = body.description ? stripTags(String(body.description).trim()).slice(0, 500) : null;
    const logo = body.logo ? sanitizeUrl(body.logo) : null;

    if (!name || !TYPES.includes(type) || !canton || !city || !contactName) {
      return NextResponse.json({ error: "Please fill in all required fields" }, { status: 400 });
    }
    if (!EMAIL_RE.test(contactEmail)) {
      return NextResponse.json({ error: "A valid contact email is required" }, { status: 400 });
    }
    if (body.authorized !== true) {
      return NextResponse.json({ error: "You must confirm you are authorized" }, { status: 400 });
    }

    const school = await prisma.school.create({
      data: { name, type, canton, city, contactName, contactEmail, website, description, logo },
      select: { id: true, name: true },
    });

    sendEmail({
      to: ADMIN_EMAIL,
      subject: `New school registration: ${name} (${canton})`,
      text: `New school registration:\n\nName: ${name}\nType: ${type}\nCanton: ${canton}\nCity: ${city}\nContact: ${contactName} (${contactEmail})\nWebsite: ${website || "—"}\n\nReview it in the admin dashboard.`,
      type: "school_registration",
    }).catch((err) => logger.error("School registration email failed", { error: String(err) }));

    return NextResponse.json({ success: true, id: school.id }, { status: 201 });
  } catch (error) {
    logger.error("Register school error", { error: String(error) });
    return NextResponse.json({ error: "Failed to register school" }, { status: 500 });
  }
}
