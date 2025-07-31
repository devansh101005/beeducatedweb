/*
  Warnings:

  - You are about to drop the column `name` on the `OfflineStudent` table. All the data in the column will be lost.
  - You are about to drop the column `otpExpiry` on the `OfflineStudent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OfflineStudent" DROP COLUMN "name",
DROP COLUMN "otpExpiry";
