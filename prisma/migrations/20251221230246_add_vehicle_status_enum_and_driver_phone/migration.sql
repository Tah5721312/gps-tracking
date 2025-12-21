/*
  Warnings:

  - The `status` column on the `Vehicle` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('moving', 'stopped', 'turnoff');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "driverPhone" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'turnoff';
