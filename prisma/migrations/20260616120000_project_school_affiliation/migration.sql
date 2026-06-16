-- Project: school affiliation approval workflow
ALTER TABLE "Project" ADD COLUMN     "schoolAffiliation" TEXT;
ALTER TABLE "Project" ADD COLUMN     "schoolApprovedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN     "schoolApprovedBy" TEXT;

-- Preserve existing behaviour: projects already linked to a school are treated as approved.
UPDATE "Project" SET "schoolAffiliation" = 'APPROVED', "schoolApprovedAt" = CURRENT_TIMESTAMP WHERE "schoolId" IS NOT NULL;
