import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const data = await request.json();
    const {
      name,
      problem,
      solution,
      industry,
      stage,
      location,
      isRemote,
      targetCustomer,
      scope,
      competitiveLandscape,
      investorPitch,
      fundingAmount,
      useOfFunds,
      tractionMetrics,
      investorVisible,
      seriousness,
      teamCompensation,
      logo,
      rolesNeeded,
    } = data;

    const project = await prisma.project.create({
      data: {
        name,
        problem,
        solution,
        industry,
        stage: stage || "IDEA",
        location: location || "Zurich",
        isRemote: isRemote || false,
        targetCustomer: targetCustomer || null,
        scope: scope || null,
        competitiveLandscape: competitiveLandscape || null,
        investorPitch: investorPitch || null,
        fundingAmount: fundingAmount ?? null,
        useOfFunds: useOfFunds || null,
        tractionMetrics: tractionMetrics || null,
        investorVisible: investorVisible || false,
        seriousness: seriousness || "SIDE_PROJECT",
        teamCompensation: teamCompensation || "UNPAID",
        logo: logo || null,
        rolesNeeded: rolesNeeded || null,
        ownerId: userId,
        teamSize: 1,
        members: {
          create: {
            userId,
            roleTitle: "Founder",
            isFounder: true,
          },
        },
      },
    });

    await prisma.conversation.create({
      data: {
        projectId: project.id,
        participants: {
          create: [{ userId }],
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, image: true, identityVerified: true },
            },
          },
        },
        _count: { select: { followers: true } },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("List projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
