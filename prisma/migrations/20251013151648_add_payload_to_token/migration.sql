/*
  Warnings:

  - Added the required column `hashedPassword` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationalId` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "hashedPassword" TEXT NOT NULL,
ADD COLUMN     "laserCode" TEXT,
ADD COLUMN     "nationalId" TEXT NOT NULL;
