-- CreateEnum (if not exists)
DO $$ BEGIN
 CREATE TYPE "VehicleStatus" AS ENUM('moving', 'stopped', 'turnoff');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Update Vehicle table
ALTER TABLE "Vehicle" 
  ADD COLUMN IF NOT EXISTS "driverPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "stoppedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "totalStoppedTime" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dailyDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dailyMaxSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dailyStartTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dailyStops" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastResetDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update status column if needed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Vehicle' AND column_name = 'status' AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "status";
    ALTER TABLE "Vehicle" ADD COLUMN "status" "VehicleStatus" NOT NULL DEFAULT 'turnoff';
  END IF;
END $$;

-- AlterTable: Update TrackingPoint table
ALTER TABLE "TrackingPoint"
  ADD COLUMN IF NOT EXISTS "heading" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "gpsAccuracy" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "altitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "batteryLevel" DROP NOT NULL;

-- CreateTable: DailyReport
CREATE TABLE IF NOT EXISTS "DailyReport" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "totalStoppedTime" INTEGER NOT NULL DEFAULT 0,
    "totalMovingTime" INTEGER NOT NULL DEFAULT 0,
    "maxSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "numberOfStops" INTEGER NOT NULL DEFAULT 0,
    "longestStop" INTEGER NOT NULL DEFAULT 0,
    "firstMovement" TIMESTAMP(3),
    "lastMovement" TIMESTAMP(3),
    "startLat" DOUBLE PRECISION,
    "startLng" DOUBLE PRECISION,
    "endLat" DOUBLE PRECISION,
    "endLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Alert
CREATE TABLE IF NOT EXISTS "Alert" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Vehicle_status_idx" ON "Vehicle"("status");
CREATE INDEX IF NOT EXISTS "Vehicle_lastUpdate_idx" ON "Vehicle"("lastUpdate");
CREATE INDEX IF NOT EXISTS "TrackingPoint_vehicleId_timestamp_idx" ON "TrackingPoint"("vehicleId", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "TrackingPoint_timestamp_idx" ON "TrackingPoint"("timestamp" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "DailyReport_vehicleId_date_key" ON "DailyReport"("vehicleId", "date");
CREATE INDEX IF NOT EXISTS "DailyReport_date_idx" ON "DailyReport"("date" DESC);
CREATE INDEX IF NOT EXISTS "DailyReport_vehicleId_date_idx" ON "DailyReport"("vehicleId", "date" DESC);
CREATE INDEX IF NOT EXISTS "Alert_vehicleId_isRead_idx" ON "Alert"("vehicleId", "isRead");
CREATE INDEX IF NOT EXISTS "Alert_createdAt_idx" ON "Alert"("createdAt" DESC);

-- AddForeignKey
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'DailyReport_vehicleId_fkey'
  ) THEN
    ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_vehicleId_fkey" 
      FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Note: Trip table will be dropped manually if needed
-- DROP TABLE IF EXISTS "Trip" CASCADE;

