/*
  Warnings:

  - You are about to drop the column `driverName` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `driverPhone` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the `Trip` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "TrackingPoint" DROP CONSTRAINT "TrackingPoint_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_vehicleId_fkey";

-- DropIndex
DROP INDEX "TrackingPoint_vehicleId_timestamp_idx";

-- DropIndex
DROP INDEX "Vehicle_plateNumber_key";

-- AlterTable
ALTER TABLE "TrackingPoint" ADD COLUMN     "altitude" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gpsAccuracy" DOUBLE PRECISION,
ADD COLUMN     "heading" DOUBLE PRECISION,
ALTER COLUMN "batteryLevel" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "driverName",
DROP COLUMN "driverPhone",
ADD COLUMN     "dailyDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "dailyMaxSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "dailyStartTime" TIMESTAMP(3),
ADD COLUMN     "dailyStops" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "driverId" INTEGER,
ADD COLUMN     "lastResetDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "plateNumber" DROP NOT NULL;

-- DropTable
DROP TABLE "Trip";

-- CreateTable
CREATE TABLE "Driver" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "nationalId" TEXT,
    "province" TEXT,
    "birthDate" DATE,
    "notes" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
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

-- CreateTable
CREATE TABLE "Alert" (
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

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phone_key" ON "Driver"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_nationalId_key" ON "Driver"("nationalId");

-- CreateIndex
CREATE INDEX "Driver_name_idx" ON "Driver"("name");

-- CreateIndex
CREATE INDEX "Driver_phone_idx" ON "Driver"("phone");

-- CreateIndex
CREATE INDEX "Driver_userId_idx" ON "Driver"("userId");

-- CreateIndex
CREATE INDEX "DailyReport_date_idx" ON "DailyReport"("date" DESC);

-- CreateIndex
CREATE INDEX "DailyReport_vehicleId_date_idx" ON "DailyReport"("vehicleId", "date" DESC);

-- CreateIndex
CREATE INDEX "DailyReport_vehicleId_idx" ON "DailyReport"("vehicleId");

-- CreateIndex
CREATE INDEX "DailyReport_firstMovement_idx" ON "DailyReport"("firstMovement");

-- CreateIndex
CREATE INDEX "DailyReport_lastMovement_idx" ON "DailyReport"("lastMovement");

-- CreateIndex
CREATE INDEX "DailyReport_date_firstMovement_lastMovement_idx" ON "DailyReport"("date", "firstMovement", "lastMovement");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_vehicleId_date_key" ON "DailyReport"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "Alert_vehicleId_isRead_idx" ON "Alert"("vehicleId", "isRead");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "TrackingPoint_vehicleId_timestamp_idx" ON "TrackingPoint"("vehicleId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "TrackingPoint_timestamp_idx" ON "TrackingPoint"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_lastUpdate_idx" ON "Vehicle"("lastUpdate");

-- CreateIndex
CREATE INDEX "Vehicle_driverId_idx" ON "Vehicle"("driverId");

-- CreateIndex
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingPoint" ADD CONSTRAINT "TrackingPoint_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
