import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.problem !== undefined) updateData.problem = data.problem;
    if (data.solution !== undefined) updateData.solution = data.solution;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.isRemote !== undefined) updateData.isRemote = data.isRemote;
    if (data.targetCustomer !== undefined) updateData.targetCustomer = data.targetCustomer;
    if (data.scope !== undefined) updateData.scope = data.scope;
    if (data.competitiveLandscape !== undefined) updateData.competitiveLandscape = data.competitiveLandscape;
    if (data.investorPitch !== undefined) updateData.investorPitch = data.investorPitch;
    if (data.fundingAmount !== undefined) updateData.fundingAmount = data.fundingAmount;
    if (data.useOfFunds !== undefined) updateData.useOfFunds = data.useOfFunds;
    if (data.tractionMetrics !== undefined) updateData.tractionMetrics = data.tractionMetrics;
    if (data.investorVisible !== undefined) updateData.investorVisible = data.investorVisible;

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { message: "Failed to update project" },
      { status: 500 }
    );
  }
}
