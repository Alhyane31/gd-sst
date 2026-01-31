/*
  Warnings:

  - You are about to drop the `Visite` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ConvocationStatut" AS ENUM ('A_CONVOQUER', 'CONVOCATION_GENEREE', 'A_TRAITER', 'A_RELANCER', 'RELANCEE', 'REALISEE');

-- DropForeignKey
ALTER TABLE "Visite" DROP CONSTRAINT "Visite_personnelId_fkey";

-- DropTable
DROP TABLE "Visite";

-- DropEnum
DROP TYPE "VisiteStatut";

-- CreateTable
CREATE TABLE "Convocation" (
    "id" TEXT NOT NULL,
    "datePrevue" TIMESTAMP(3) NOT NULL,
    "dateRealisee" TIMESTAMP(3),
    "type" "VisiteType" NOT NULL,
    "statut" "ConvocationStatut" NOT NULL DEFAULT 'A_CONVOQUER',
    "convocationType" "ConvocationType" NOT NULL DEFAULT 'INITIALE',
    "dateConvocation" TIMESTAMP(3),
    "commentaire" TEXT,
    "personnelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Convocation_personnelId_datePrevue_idx" ON "Convocation"("personnelId", "datePrevue");

-- CreateIndex
CREATE INDEX "Convocation_statut_idx" ON "Convocation"("statut");

-- CreateIndex
CREATE INDEX "Convocation_type_idx" ON "Convocation"("type");

-- AddForeignKey
ALTER TABLE "Convocation" ADD CONSTRAINT "Convocation_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
