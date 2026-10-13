-- Module AES : déclaration, calendrier de suivi, consultations, référentiel paramétrable
-- CreateEnum
CREATE TYPE "AesStatut" AS ENUM ('BROUILLON', 'VALIDEE', 'CLOTUREE');

-- CreateEnum
CREATE TYPE "AesSuiviCode" AS ENUM ('J1_J7', 'S2', 'S6', 'S12');

-- CreateEnum
CREATE TYPE "AesSuiviStatut" AS ENUM ('PREVUE', 'FAITE', 'NON_INDIQUEE', 'NON_FAITE');


-- CreateTable
CREATE TABLE "AesDeclaration" (
    "id" TEXT NOT NULL,
    "visiteId" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "statut" "AesStatut" NOT NULL DEFAULT 'BROUILLON',
    "data" JSONB,
    "dateHeureAes" TIMESTAMP(3),
    "dateHeureDeclaration" TIMESTAMP(3),
    "lieu" TEXT,
    "service" TEXT,
    "geste" TEXT,
    "typeExposition" TEXT,
    "niveauRisque" TEXT,
    "tpe" TEXT,
    "declarationAT" TEXT,
    "causes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "motifArretSuivi" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedById" TEXT,
    "clotureAt" TIMESTAMP(3),
    "clotureById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AesDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AesSuiviVisite" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "code" "AesSuiviCode" NOT NULL,
    "datePrevue" TIMESTAMP(3) NOT NULL,
    "statut" "AesSuiviStatut" NOT NULL DEFAULT 'PREVUE',
    "bilans" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AesSuiviVisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AesConsultation" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "visite" TEXT NOT NULL,
    "dateConsultation" TIMESTAMP(3) NOT NULL,
    "data" JSONB,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AesConsultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AesReferentiel" (
    "cle" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AesReferentiel_pkey" PRIMARY KEY ("cle")
);

-- CreateIndex
CREATE UNIQUE INDEX "AesDeclaration_visiteId_key" ON "AesDeclaration"("visiteId");

-- CreateIndex
CREATE INDEX "AesDeclaration_personnelId_idx" ON "AesDeclaration"("personnelId");

-- CreateIndex
CREATE INDEX "AesDeclaration_statut_idx" ON "AesDeclaration"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "AesSuiviVisite_declarationId_code_key" ON "AesSuiviVisite"("declarationId", "code");

-- CreateIndex
CREATE INDEX "AesConsultation_declarationId_idx" ON "AesConsultation"("declarationId");

-- AddForeignKey
ALTER TABLE "AesDeclaration" ADD CONSTRAINT "AesDeclaration_visiteId_fkey" FOREIGN KEY ("visiteId") REFERENCES "Visite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AesDeclaration" ADD CONSTRAINT "AesDeclaration_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AesDeclaration" ADD CONSTRAINT "AesDeclaration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AesDeclaration" ADD CONSTRAINT "AesDeclaration_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AesDeclaration" ADD CONSTRAINT "AesDeclaration_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AesDeclaration" ADD CONSTRAINT "AesDeclaration_clotureById_fkey" FOREIGN KEY ("clotureById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AesSuiviVisite" ADD CONSTRAINT "AesSuiviVisite_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "AesDeclaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AesConsultation" ADD CONSTRAINT "AesConsultation_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "AesDeclaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AesConsultation" ADD CONSTRAINT "AesConsultation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AesConsultation" ADD CONSTRAINT "AesConsultation_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

