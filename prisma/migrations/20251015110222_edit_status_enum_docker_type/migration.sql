/*
  Warnings:

  - The values [PAYMENT_SLIP,ENROLLMENT_CONFIRMATION,ENROLLMENT_CONTRACT,ENROLLMENT_FORM] on the enum `DocumentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentType_new" AS ENUM ('PHASE2_PAYMENT_SLIP', 'PHASE2_CONFIRMATION', 'PHASE3_CONSENT', 'PHASE3_CONTRACT', 'PHASE3_ENROLLMENT');
ALTER TABLE "Document" ALTER COLUMN "documentType" TYPE "DocumentType_new" USING ("documentType"::text::"DocumentType_new");
ALTER TYPE "DocumentType" RENAME TO "DocumentType_old";
ALTER TYPE "DocumentType_new" RENAME TO "DocumentType";
DROP TYPE "public"."DocumentType_old";
COMMIT;
