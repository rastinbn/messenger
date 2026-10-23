-- CreateEnum
CREATE TYPE "SiteRole" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "siteRole" "SiteRole" NOT NULL DEFAULT 'user',
ADD COLUMN     "suspendedAt" TIMESTAMP(3);
