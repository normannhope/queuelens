-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('PEOPLE', 'VEHICLES', 'CUSTOM');

-- AlterTable
ALTER TABLE "Hub" ADD COLUMN     "subjectType" "Subject" NOT NULL DEFAULT 'PEOPLE';
