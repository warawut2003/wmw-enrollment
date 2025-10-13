/*
  Warnings:

  - You are about to drop the column `firstname` on the `Application` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" DROP COLUMN "firstname",
ADD COLUMN     "firstName" TEXT NOT NULL;
