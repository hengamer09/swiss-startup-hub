-- Event: pitch competition flag + voting close timestamp
ALTER TABLE "Event" ADD COLUMN     "isPitchCompetition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "votingClosedAt" TIMESTAMP(3);

-- Fundraiser: lifecycle fields
ALTER TABLE "Fundraiser" ADD COLUMN     "goalReachedNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedBy" TEXT;

-- EventTeam: teams registered for a pitch competition
CREATE TABLE "EventTeam" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventTeam_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EventTeam_eventId_projectId_key" ON "EventTeam"("eventId", "projectId");
ALTER TABLE "EventTeam" ADD CONSTRAINT "EventTeam_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventTeam" ADD CONSTRAINT "EventTeam_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
