-- AlterTable
ALTER TABLE "EventAttendee" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "EventPost" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventPost_eventId_createdAt_idx" ON "EventPost"("eventId", "createdAt");

-- AddForeignKey
ALTER TABLE "EventPost" ADD CONSTRAINT "EventPost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPost" ADD CONSTRAINT "EventPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
