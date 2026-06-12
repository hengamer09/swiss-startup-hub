// Server-only — helpers for per-project group chats.
import { APP_URL } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ProjectLike {
  id: string;
  name: string;
  ownerId: string;
  problem?: string | null;
  solution?: string | null;
  industry?: string | null;
}

/**
 * Creates the group conversation for a freshly created project:
 * adds the owner as the first participant and posts a welcome
 * BOT_NOTIFICATION. Group chats are pinned to the top by default.
 */
export async function createProjectGroupChat(db: any, project: ProjectLike): Promise<string> {
  const summarySource = (project.problem || project.solution || "").trim();
  const summary = summarySource.slice(0, 150) || "No summary yet.";
  const link = `${APP_URL}/projects/${project.id}`;
  const niche = project.industry ? ` Niche: ${project.industry}.` : "";

  const conversation = await db.conversation.create({
    data: {
      projectId: project.id,
      isGroup: true,
      pinnedByDefault: true,
      participants: { create: [{ userId: project.ownerId }] },
    },
    select: { id: true },
  });

  await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: project.ownerId,
      content: `Welcome to the ${project.name} team chat! This is where your team can coordinate. Here's a summary: ${summary}.${niche} View project: ${link}`,
      type: "BOT_NOTIFICATION",
      projectId: project.id,
    },
  });

  return conversation.id;
}

/** Returns the group conversation id for a project, if one exists. */
export async function getProjectGroupChatId(db: any, projectId: string): Promise<string | null> {
  const conv = await db.conversation.findFirst({
    where: { projectId, isGroup: true },
    select: { id: true },
  });
  return conv?.id ?? null;
}

/**
 * Adds a newly accepted member to the project group chat (idempotent) and
 * posts a system message announcing they joined.
 */
export async function addMemberToGroupChat(
  db: any,
  projectId: string,
  userId: string,
  name: string,
  role: string
): Promise<void> {
  const conversationId = await getProjectGroupChatId(db, projectId);
  if (!conversationId) return;

  const existing = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { id: true },
  });
  if (existing) return;

  await db.conversationParticipant.create({ data: { conversationId, userId } });

  await db.message.create({
    data: {
      conversationId,
      senderId: userId,
      content: `${name || "A new member"} has joined the team as ${role || "a team member"}!`,
      type: "BOT_NOTIFICATION",
      projectId,
    },
  });

  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

/** Removes a member from the project group chat when they leave or are removed. */
export async function removeMemberFromGroupChat(
  db: any,
  projectId: string,
  userId: string
): Promise<void> {
  const conversationId = await getProjectGroupChatId(db, projectId);
  if (!conversationId) return;

  await db.conversationParticipant.deleteMany({ where: { conversationId, userId } });
}
