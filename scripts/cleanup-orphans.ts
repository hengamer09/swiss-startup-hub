/**
 * One-time cleanup of orphan / broken data.
 *
 * Removes records that point at users, projects, events or conversations that
 * no longer exist (these surface as "Unknown" in the UI). Safe to re-run.
 *
 * Usage: npx tsx scripts/cleanup-orphans.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function run(label: string, sql: string) {
  const count = await prisma.$executeRawUnsafe(sql);
  console.log(`  ${label}: ${count} row(s) deleted`);
  return count;
}

async function main() {
  console.log("🧹 Cleaning up orphan data...");

  // 1) Messages whose sender no longer exists.
  await run(
    "messages w/ missing sender",
    `DELETE FROM "Message" AS m WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = m."senderId")`
  );

  // 2) Messages whose conversation no longer exists.
  await run(
    "messages w/ missing conversation",
    `DELETE FROM "Message" AS m WHERE NOT EXISTS (SELECT 1 FROM "Conversation" c WHERE c.id = m."conversationId")`
  );

  // 3) Conversation participants whose user no longer exists.
  await run(
    "participants w/ missing user",
    `DELETE FROM "ConversationParticipant" AS p WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = p."userId")`
  );

  // 4) Conversation pins whose user no longer exists.
  await run(
    "pins w/ missing user",
    `DELETE FROM "ConversationPin" AS p WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = p."userId")`
  );

  // 5) Broken 1:1 conversations: non-group conversations that no longer have
  //    two participants (the other user was deleted). Cascades to their
  //    messages, participants and pins.
  await run(
    "broken 1:1 conversations",
    `DELETE FROM "Conversation" AS c
     WHERE c."isGroup" = false
       AND (SELECT COUNT(*) FROM "ConversationParticipant" p WHERE p."conversationId" = c.id) < 2`
  );

  // 6) Group conversations with no remaining participants.
  await run(
    "empty group conversations",
    `DELETE FROM "Conversation" AS c
     WHERE (SELECT COUNT(*) FROM "ConversationParticipant" p WHERE p."conversationId" = c.id) = 0`
  );

  // 7) Join requests whose user or project no longer exists.
  await run(
    "join requests w/ missing user/project",
    `DELETE FROM "JoinRequest" AS j
     WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = j."userId")
        OR NOT EXISTS (SELECT 1 FROM "Project" pr WHERE pr.id = j."projectId")`
  );

  // 8) Event attendees whose user or event no longer exists.
  await run(
    "event attendees w/ missing user/event",
    `DELETE FROM "EventAttendee" AS a
     WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = a."userId")
        OR NOT EXISTS (SELECT 1 FROM "Event" e WHERE e.id = a."eventId")`
  );

  // 9) Bookmarks whose user or project no longer exists.
  await run(
    "bookmarks w/ missing user/project",
    `DELETE FROM "Bookmark" AS b
     WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = b."userId")
        OR NOT EXISTS (SELECT 1 FROM "Project" pr WHERE pr.id = b."projectId")`
  );

  console.log("✅ Cleanup complete.");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
