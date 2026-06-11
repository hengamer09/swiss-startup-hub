import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { stripTags } from "@/lib/utils";
import { logger } from "@/lib/logger";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`signup:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { name, email, password, role, skills, acceptedTerms, confirmedAge } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (acceptedTerms !== true) {
      return NextResponse.json(
        { error: "You must accept the Terms of Service" },
        { status: 400 }
      );
    }

    if (confirmedAge !== true) {
      return NextResponse.json(
        { error: "You must be at least 18 years old to use this platform" },
        { status: 400 }
      );
    }

    const cleanName = stripTags(String(name).trim());
    const cleanEmail = stripTags(String(email).trim());

    if (cleanName.length > 100) return NextResponse.json({ error: "Name too long" }, { status: 400 });
    if (cleanEmail.length > 255) return NextResponse.json({ error: "Email too long" }, { status: 400 });
    if (!EMAIL_RE.test(cleanEmail)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    if (String(password).length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    if (String(password).length > 128) return NextResponse.json({ error: "Password too long" }, { status: 400 });

    if (!["FOUNDER", "PROFESSIONAL", "INVESTOR"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        roles: JSON.stringify([role]),
        isEarlyMember: true,
        acceptedTerms: true,
        acceptedTermsAt: new Date(),
        confirmedAge: true,
      },
      select: { id: true },
    });

    if (skills && Array.isArray(skills) && skills.length > 0) {
      for (const skillName of skills.slice(0, 3)) {
        const skill = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });

        await prisma.userSkill.create({
          data: {
            userId: user.id,
            skillId: skill.id,
          },
        });
      }
    }

    return NextResponse.json(
      { userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Signup error", { error: String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
