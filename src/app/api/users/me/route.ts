import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags, sanitizeUrl } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, image: true },
    });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Conversations the user is part of — checked for emptiness after deletion.
      const myConvs = await tx.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
        take: 1000,
      });
      const myConvIds = myConvs.map((c) => c.conversationId);

      // 1. Conversation pins
      await tx.conversationPin.deleteMany({ where: { userId } });
      // 2. Messages sent or received by the user
      await tx.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
      // 3. Remove the user from all conversations
      await tx.conversationParticipant.deleteMany({ where: { userId } });
      // 4. Bookmarks
      await tx.bookmark.deleteMany({ where: { userId } });
      // 5. Ratings (no cascade) — given, received, and on the user's projects
      await tx.rating.deleteMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } });
      await tx.rating.deleteMany({ where: { project: { ownerId: userId } } });
      // 6. Blocks and reports (no cascade)
      await tx.blockedUser.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });
      await tx.report.deleteMany({ where: { reporterId: userId } });
      // 7. Posts authored by the user (author is SetNull, so delete explicitly)
      await tx.projectPost.deleteMany({ where: { authorId: userId } });
      await tx.eventPost.deleteMany({ where: { authorId: userId } });
      // 8. Join requests + event attendance
      await tx.joinRequest.deleteMany({ where: { userId } });
      await tx.eventAttendee.deleteMany({ where: { userId } });
      // 9. Email subscription (relation is SetNull, so delete explicitly)
      await tx.emailSubscription.deleteMany({
        where: { OR: [{ userId }, ...(me.email ? [{ email: me.email }] : [])] },
      });

      // 10. Projects owned — delete their group chats first (projectId is SetNull),
      //     then the projects (cascades members, followers, posts, faqs, openRoles).
      const myProjects = await tx.project.findMany({
        where: { ownerId: userId },
        select: { id: true },
        take: 1000,
      });
      const projectIds = myProjects.map((p) => p.id);
      if (projectIds.length > 0) {
        await tx.conversation.deleteMany({ where: { projectId: { in: projectIds } } });
        await tx.project.deleteMany({ where: { id: { in: projectIds } } });
      }

      // 11. Events organized (cascades attendees, posts)
      await tx.event.deleteMany({ where: { organizerId: userId } });

      // 12. The user (cascades skills, memberships, followers, notifications, reviews)
      await tx.user.delete({ where: { id: userId } });

      // 13. Clean up conversations left broken by the user's departure
      if (myConvIds.length > 0) {
        const remaining = await tx.conversation.findMany({
          where: { id: { in: myConvIds } },
          select: { id: true, isGroup: true, _count: { select: { participants: true } } },
        });
        const toDelete = remaining
          .filter((c) => (c.isGroup ? c._count.participants === 0 : c._count.participants < 2))
          .map((c) => c.id);
        if (toDelete.length > 0) {
          await tx.conversation.deleteMany({ where: { id: { in: toDelete } } });
        }
      }
    });

    // Best-effort: delete the profile image from Blob storage.
    if (me.image && sanitizeUrl(me.image) && me.image.includes("blob.vercel-storage.com")) {
      try {
        await del(me.image, { token: process.env.BLOB_READ_WRITE_TOKEN });
      } catch (err) {
        logger.error("Failed to delete profile image from blob", { userId, error: String(err) });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Account deletion error", { userId, error: String(error) });
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const data = await request.json();

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = stripTags(String(data.name).trim()).slice(0, 100);
    if (data.bio !== undefined) updateData.bio = stripTags(String(data.bio).trim()).slice(0, 1000);
    if (data.image !== undefined) updateData.image = data.image;
    if (data.location !== undefined) updateData.location = stripTags(String(data.location).trim()).slice(0, 200);
    if (data.country !== undefined) updateData.country = data.country;
    if (data.canton !== undefined) updateData.canton = data.canton;
    if (data.portfolioUrl !== undefined) updateData.portfolioUrl = sanitizeUrl(data.portfolioUrl);
    if (data.websiteUrl !== undefined) updateData.websiteUrl = sanitizeUrl(data.websiteUrl);
    if (data.githubUrl !== undefined) updateData.githubUrl = sanitizeUrl(data.githubUrl);
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = sanitizeUrl(data.linkedinUrl);
    if (data.portfolioProjects !== undefined) updateData.portfolioProjects = data.portfolioProjects;
    if (data.roles !== undefined) updateData.roles = JSON.stringify(data.roles);
    if (data.openToMessages !== undefined)
      updateData.openToMessages = data.openToMessages;
    if (data.availableForMentoring !== undefined)
      updateData.availableForMentoring = Boolean(data.availableForMentoring);
    if (data.mentoringStyle !== undefined)
      updateData.mentoringStyle = data.mentoringStyle ? stripTags(String(data.mentoringStyle).trim()).slice(0, 50) : null;
    if (data.mentorBio !== undefined)
      updateData.mentorBio = stripTags(String(data.mentorBio).trim()).slice(0, 500);
    if (data.preferredStage !== undefined)
      updateData.preferredStage = data.preferredStage;
    if (data.ticketSizeMin !== undefined)
      updateData.ticketSizeMin = data.ticketSizeMin;
    if (data.ticketSizeMax !== undefined)
      updateData.ticketSizeMax = data.ticketSizeMax;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      omit: { passwordHash: true },
    });

    if (data.skills !== undefined && Array.isArray(data.skills)) {
      await prisma.userSkill.deleteMany({ where: { userId } });
      for (const raw of (data.skills as unknown[]).slice(0, 20)) {
        const name = stripTags(String(raw).trim()).slice(0, 100);
        if (!name) continue;
        const skill = await prisma.skill.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        await prisma.userSkill.create({ data: { userId, skillId: skill.id } });
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error("Update user error", { userId, error: String(error) });
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      omit: { passwordHash: true },
      include: {
        skills: { include: { skill: true } },
        memberships: {
          include: { project: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    logger.error("Get user error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
