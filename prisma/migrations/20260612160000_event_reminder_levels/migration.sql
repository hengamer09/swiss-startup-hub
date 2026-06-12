-- Rename the single reminder flag to the 1-day flag and add a 7-day flag.
ALTER TABLE "EventAttendee" RENAME COLUMN "reminderSent" TO "reminder1dSent";
ALTER TABLE "EventAttendee" ADD COLUMN     "reminder7dSent" BOOLEAN NOT NULL DEFAULT false;
