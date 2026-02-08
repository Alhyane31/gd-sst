-- CreateEnum
CREATE TYPE "BordereauStatut" AS ENUM ('NOUVEAU', 'GENERE');

-- AlterTable
ALTER TABLE "Convocation" ADD COLUMN     "bordereauId" TEXT;

-- CreateTable
CREATE TABLE "Bordereau" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "dateEdition" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serialNumber" TEXT NOT NULL,
    "statut" "BordereauStatut" NOT NULL DEFAULT 'NOUVEAU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bordereau_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bordereau_serialNumber_key" ON "Bordereau"("serialNumber");

-- AddForeignKey
ALTER TABLE "Convocation" ADD CONSTRAINT "Convocation_bordereauId_fkey" FOREIGN KEY ("bordereauId") REFERENCES "Bordereau"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bordereau" ADD CONSTRAINT "Bordereau_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
