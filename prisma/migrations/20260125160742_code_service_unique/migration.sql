/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Service_code_formationId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");
