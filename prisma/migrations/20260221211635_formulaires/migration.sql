/*
  Warnings:

  - A unique constraint covering the columns `[matricule]` on the table `Personnel` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Cim11Level" AS ENUM ('L1', 'L2', 'L3', 'L4', 'L5');

-- CreateEnum
CREATE TYPE "VisiteStatut" AS ENUM ('BROUILLON', 'EN_COURS', 'CLOTUREE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "FormulaireStatut" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "FormSectionKey" AS ENUM ('INFORMATIONS_GENERALES', 'INFORMATIONS_PROFESSIONNELLES', 'ANTECEDENTS', 'RENSEIGNEMENTS_PROFESSIONNELS');

-- CreateEnum
CREATE TYPE "StatutSocial" AS ENUM ('CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF');

-- AlterTable
ALTER TABLE "Personnel" ADD COLUMN     "dateAffectation" TIMESTAMP(3),
ADD COLUMN     "dateNaissance" TIMESTAMP(3),
ADD COLUMN     "matricule" TEXT,
ADD COLUMN     "statutSocial" "StatutSocial";

-- CreateTable
CREATE TABLE "PersonnelAffectationHistory" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "dateAffectation" TIMESTAMP(3) NOT NULL,
    "formulaireId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonnelAffectationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visite" (
    "id" TEXT NOT NULL,
    "type" "VisiteType" NOT NULL,
    "statut" "VisiteStatut" NOT NULL DEFAULT 'BROUILLON',
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "personnelId" TEXT NOT NULL,
    "convocationId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formulaire" (
    "id" TEXT NOT NULL,
    "visiteId" TEXT,
    "personnelId" TEXT NOT NULL,
    "statut" "FormulaireStatut" NOT NULL DEFAULT 'DRAFT',
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "sectionsEnabled" "FormSectionKey"[] DEFAULT ARRAY['INFORMATIONS_GENERALES', 'INFORMATIONS_PROFESSIONNELLES']::"FormSectionKey"[],
    "snapshotFirstName" TEXT,
    "snapshotLastName" TEXT,
    "snapshotMatricule" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "statutSocial" "StatutSocial",
    "aTravailleHorsCHUIR" BOOLEAN,
    "autreLieuTravail" TEXT,
    "autreDureeAnnees" INTEGER,
    "autreHoraires" TEXT,
    "serviceId" TEXT,
    "dateAffectation" TIMESTAMP(3),
    "data" JSONB,
    "propagatedToPersonnelAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "filledById" TEXT,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formationId" TEXT,

    CONSTRAINT "Formulaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cim11Node" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "level" "Cim11Level" NOT NULL,
    "parentId" TEXT,
    "isLeaf" BOOLEAN NOT NULL DEFAULT false,
    "pathCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cim11Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonnelPathologie" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "cim11NodeId" TEXT NOT NULL,
    "formulaireId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,
    "source" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonnelPathologie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonnelAffectationHistory_personnelId_dateAffectation_idx" ON "PersonnelAffectationHistory"("personnelId", "dateAffectation");

-- CreateIndex
CREATE UNIQUE INDEX "Visite_convocationId_key" ON "Visite"("convocationId");

-- CreateIndex
CREATE INDEX "Visite_personnelId_dateDebut_idx" ON "Visite"("personnelId", "dateDebut");

-- CreateIndex
CREATE INDEX "Visite_statut_idx" ON "Visite"("statut");

-- CreateIndex
CREATE INDEX "Visite_type_idx" ON "Visite"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Formulaire_visiteId_key" ON "Formulaire"("visiteId");

-- CreateIndex
CREATE UNIQUE INDEX "Cim11Node_code_key" ON "Cim11Node"("code");

-- CreateIndex
CREATE INDEX "Cim11Node_level_idx" ON "Cim11Node"("level");

-- CreateIndex
CREATE INDEX "Cim11Node_parentId_idx" ON "Cim11Node"("parentId");

-- CreateIndex
CREATE INDEX "Cim11Node_libelle_idx" ON "Cim11Node"("libelle");

-- CreateIndex
CREATE INDEX "PersonnelPathologie_personnelId_date_idx" ON "PersonnelPathologie"("personnelId", "date");

-- CreateIndex
CREATE INDEX "PersonnelPathologie_cim11NodeId_idx" ON "PersonnelPathologie"("cim11NodeId");

-- CreateIndex
CREATE INDEX "PersonnelPathologie_formulaireId_idx" ON "PersonnelPathologie"("formulaireId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonnelPathologie_personnelId_cim11NodeId_date_key" ON "PersonnelPathologie"("personnelId", "cim11NodeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_matricule_key" ON "Personnel"("matricule");

-- AddForeignKey
ALTER TABLE "PersonnelAffectationHistory" ADD CONSTRAINT "PersonnelAffectationHistory_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnelAffectationHistory" ADD CONSTRAINT "PersonnelAffectationHistory_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnelAffectationHistory" ADD CONSTRAINT "PersonnelAffectationHistory_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnelAffectationHistory" ADD CONSTRAINT "PersonnelAffectationHistory_formulaireId_fkey" FOREIGN KEY ("formulaireId") REFERENCES "Formulaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visite" ADD CONSTRAINT "Visite_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visite" ADD CONSTRAINT "Visite_convocationId_fkey" FOREIGN KEY ("convocationId") REFERENCES "Convocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visite" ADD CONSTRAINT "Visite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visite" ADD CONSTRAINT "Visite_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulaire" ADD CONSTRAINT "Formulaire_visiteId_fkey" FOREIGN KEY ("visiteId") REFERENCES "Visite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulaire" ADD CONSTRAINT "Formulaire_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulaire" ADD CONSTRAINT "Formulaire_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulaire" ADD CONSTRAINT "Formulaire_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulaire" ADD CONSTRAINT "Formulaire_filledById_fkey" FOREIGN KEY ("filledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulaire" ADD CONSTRAINT "Formulaire_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulaire" ADD CONSTRAINT "Formulaire_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulaire" ADD CONSTRAINT "Formulaire_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cim11Node" ADD CONSTRAINT "Cim11Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Cim11Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnelPathologie" ADD CONSTRAINT "PersonnelPathologie_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnelPathologie" ADD CONSTRAINT "PersonnelPathologie_cim11NodeId_fkey" FOREIGN KEY ("cim11NodeId") REFERENCES "Cim11Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnelPathologie" ADD CONSTRAINT "PersonnelPathologie_formulaireId_fkey" FOREIGN KEY ("formulaireId") REFERENCES "Formulaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnelPathologie" ADD CONSTRAINT "PersonnelPathologie_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
