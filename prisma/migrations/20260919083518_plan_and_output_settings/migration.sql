-- AlterTable
ALTER TABLE "Hub" ADD COLUMN     "showPeopleCount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showWaitMinutes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "useTrendLearning" BOOLEAN NOT NULL DEFAULT false;
