-- Applied directly to the database outside of Prisma migrate.
-- This migration file documents the drift so Prisma history stays in sync.
ALTER TYPE "BordereauStatut" ADD VALUE IF NOT EXISTS 'ENVOYE';
ALTER TYPE "ConvocationStatut" ADD VALUE IF NOT EXISTS 'ENVOYEE';
ALTER TABLE "Bordereau" ADD COLUMN IF NOT EXISTS "dateAccuseReception" TIMESTAMP(3);
