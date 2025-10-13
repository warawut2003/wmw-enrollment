/*
  Warnings:

  - You are about to drop the column `nationId` on the `Application` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nationalId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nationalId` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_userId_fkey";

-- DropIndex
DROP INDEX "public"."Application_nationId_key";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "nationId",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "gpaScience" DOUBLE PRECISION,
ADD COLUMN     "laserCode" TEXT,
ADD COLUMN     "nationalId" TEXT NOT NULL,
ADD COLUMN     "pdpaConsent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Application_nationalId_key" ON "Application"("nationalId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
