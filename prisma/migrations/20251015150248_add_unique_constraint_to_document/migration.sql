/*
  Warnings:

  - A unique constraint covering the columns `[applicationId,documentType]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Document_applicationId_documentType_key" ON "Document"("applicationId", "documentType");
