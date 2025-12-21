-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "stoppedAt" TIMESTAMP(3),
ADD COLUMN     "totalStoppedTime" INTEGER NOT NULL DEFAULT 0;
