-- User: student & mentor fields
ALTER TABLE "User" ADD COLUMN     "isStudent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "availableForMentoring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mentoringStyle" TEXT,
ADD COLUMN     "mentorBio" TEXT;

-- Project: school link & student fields
ALTER TABLE "Project" ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "isStudentProject" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "schoolClass" TEXT,
ADD COLUMN     "supervisor" TEXT;

-- Event: school link & pitch-competition fields
ALTER TABLE "Event" ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "isSchoolEvent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxTeamsPerSchool" INTEGER,
ADD COLUMN     "prizeDescription" TEXT,
ADD COLUMN     "participatingSchools" TEXT,
ADD COLUMN     "votingClosed" BOOLEAN NOT NULL DEFAULT false;

-- School
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "canton" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "website" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "logo" TEXT,
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "School_verified_idx" ON "School"("verified");

-- SchoolMembership
CREATE TABLE "SchoolMembership" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchoolMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SchoolMembership_schoolId_userId_key" ON "SchoolMembership"("schoolId", "userId");

-- Fundraiser
CREATE TABLE "Fundraiser" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "goal" INTEGER NOT NULL,
    "currentAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Fundraiser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Fundraiser_projectId_key" ON "Fundraiser"("projectId");

-- FundraiserReward
CREATE TABLE "FundraiserReward" (
    "id" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "limit" INTEGER,
    "claimed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FundraiserReward_pkey" PRIMARY KEY ("id")
);

-- FundingPledge
CREATE TABLE "FundingPledge" (
    "id" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLEDGED',
    "rewardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FundingPledge_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FundingPledge_fundraiserId_idx" ON "FundingPledge"("fundraiserId");

-- Voucher
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "pledgeId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");
CREATE UNIQUE INDEX "Voucher_pledgeId_key" ON "Voucher"("pledgeId");

-- EventVote
CREATE TABLE "EventVote" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventVote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EventVote_eventId_voterId_key" ON "EventVote"("eventId", "voterId");
CREATE INDEX "EventVote_eventId_projectId_idx" ON "EventVote"("eventId", "projectId");

-- Foreign keys
CREATE INDEX "Project_schoolId_idx" ON "Project"("schoolId");
ALTER TABLE "Project" ADD CONSTRAINT "Project_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fundraiser" ADD CONSTRAINT "Fundraiser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FundraiserReward" ADD CONSTRAINT "FundraiserReward_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FundingPledge" ADD CONSTRAINT "FundingPledge_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FundingPledge" ADD CONSTRAINT "FundingPledge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FundingPledge" ADD CONSTRAINT "FundingPledge_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "FundraiserReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "FundraiserReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_pledgeId_fkey" FOREIGN KEY ("pledgeId") REFERENCES "FundingPledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventVote" ADD CONSTRAINT "EventVote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventVote" ADD CONSTRAINT "EventVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventVote" ADD CONSTRAINT "EventVote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
