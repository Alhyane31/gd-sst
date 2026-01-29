/*
  Warnings:

  - You are about to drop the column `date` on the `Visite` table. All the data in the column will be lost.
  - Added the required column `datePrevue` to the `Visite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Visite` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VisiteStatut" AS ENUM ('A_CONVOQUER', 'CONVOCATION_GENEREE', 'A_TRAITER', 'A_RELANCER', 'RELANCEE', 'REALISEE');

-- CreateEnum
CREATE TYPE "ConvocationType" AS ENUM ('INITIALE', 'RELANCE_1', 'RELANCE_2', 'RELANCE_3');

-- AlterTable
ALTER TABLE "Visite" DROP COLUMN "date",
ADD COLUMN     "commentaire" TEXT,
ADD COLUMN     "convocationType" "ConvocationType" NOT NULL DEFAULT 'INITIALE',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateConvocation" TIMESTAMP(3),
ADD COLUMN     "datePrevue" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dateRealisee" TIMESTAMP(3),
ADD COLUMN     "statut" "VisiteStatut" NOT NULL DEFAULT 'A_CONVOQUER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Visite_personnelId_datePrevue_idx" ON "Visite"("personnelId", "datePrevue");

-- CreateIndex
CREATE INDEX "Visite_statut_idx" ON "Visite"("statut");

-- CreateIndex
CREATE INDEX "Visite_type_idx" ON "Visite"("type");
