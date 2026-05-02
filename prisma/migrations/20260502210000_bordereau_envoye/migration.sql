-- AlterEnum
ALTER TYPE "BordereauStatut" ADD VALUE 'ENVOYE';

-- AlterTable
ALTER TABLE "Bordereau" ADD COLUMN "dateAccuseReception" TIMESTAMP(3);
