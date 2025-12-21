-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "arrivalStatus" TEXT NOT NULL DEFAULT 'in_progress',
ADD COLUMN     "arrivalTime" TIMESTAMP(3),
ADD COLUMN     "destinationLat" DOUBLE PRECISION,
ADD COLUMN     "destinationLng" DOUBLE PRECISION,
ADD COLUMN     "destinationName" TEXT;
