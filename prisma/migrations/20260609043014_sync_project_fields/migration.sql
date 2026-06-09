-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "seriousness" TEXT DEFAULT 'SIDE_PROJECT',
ADD COLUMN     "teamCompensation" TEXT DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "portfolioUrl" TEXT;
