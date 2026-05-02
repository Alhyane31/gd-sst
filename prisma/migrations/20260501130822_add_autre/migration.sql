/*
  Warnings:

  - A unique constraint covering the columns `[personnelId,formationId,serviceId,dateAffectation]` on the table `PersonnelAffectationHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "VisiteType" ADD VALUE 'AUTRE';

-- DropIndex
DROP INDEX "PersonnelAffectationHistory_personnelId_dateAffectation_idx";

-- AlterTable
ALTER TABLE "Visite" ADD COLUMN     "typeAutre" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PersonnelAffectationHistory_personnelId_formationId_service_key" ON "PersonnelAffectationHistory"("personnelId", "formationId", "serviceId", "dateAffectation");
