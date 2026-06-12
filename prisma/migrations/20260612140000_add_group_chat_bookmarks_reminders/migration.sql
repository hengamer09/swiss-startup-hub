-- Conversation: group chat + default pin flags
ALTER TABLE "Conversation" ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinnedByDefault" BOOLEAN NOT NULL DEFAULT false;

-- EventAttendee: reminder dedup flag
ALTER TABLE "EventAttendee" ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- ConversationPin: per-user pin/unpin state
CREATE TABLE "ConversationPin" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConversationPin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ConversationPin_conversationId_userId_key" ON "ConversationPin"("conversationId", "userId");
ALTER TABLE "ConversationPin" ADD CONSTRAINT "ConversationPin_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationPin" ADD CONSTRAINT "ConversationPin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bookmark: saved projects
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Bookmark_userId_projectId_key" ON "Bookmark"("userId", "projectId");
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
