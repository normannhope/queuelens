-- AlterEnum
ALTER TYPE "Plan" ADD VALUE 'FREE';

-- AlterTable
ALTER TABLE "Hub" ADD COLUMN     "staffAlertEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "staffAlertLastSentAt" TIMESTAMP(3),
ADD COLUMN     "staffAlertThreshold" "QueueLevel" NOT NULL DEFAULT 'LONG',
ADD COLUMN     "staffAlertWebhookUrl" TEXT;
