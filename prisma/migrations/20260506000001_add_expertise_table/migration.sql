-- Add missing FormSectionKey enum values
ALTER TYPE "FormSectionKey" ADD VALUE IF NOT EXISTS 'SUIVI_RAPPROCHE';
ALTER TYPE "FormSectionKey" ADD VALUE IF NOT EXISTS 'CERTIFICAT_MEDICALE';
ALTER TYPE "FormSectionKey" ADD VALUE IF NOT EXISTS 'IDENTIFICATION_EXPERTISE';
ALTER TYPE "FormSectionKey" ADD VALUE IF NOT EXISTS 'RESULTAT_EXPERTISE';

-- Create ExpertiseSource enum
DO $$ BEGIN
  CREATE TYPE "ExpertiseSource" AS ENUM (
    'CHEF_SERVICE',
    'PERSONNEL',
    'COMMISSION_MEDICALE',
    'DIRECTION',
    'SERVICE_SANTE_TRAVAIL'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create ExpertiseMotif enum
DO $$ BEGIN
  CREATE TYPE "ExpertiseMotif" AS ENUM (
    'EVALUATION_APTITUDE',
    'MUTATION_SANTE',
    'RETRAITE_ANTICIPEE',
    'ABSENCE_SANTE',
    'REPRISE_ARRET_PSYCHIATRIQUE',
    'DISPONIBILITE_SANTE',
    'CONGE_MMD',
    'CONGE_MLD'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create ExpertiseDecision enum
DO $$ BEGIN
  CREATE TYPE "ExpertiseDecision" AS ENUM (
    'AMENAGEMENT_POSTE',
    'RECLASSEMENT_PROFESSIONNEL',
    'PAS_AMENAGEMENT',
    'DECISION_DIFFEREE',
    'APTITUDE_REPRISE',
    'INAPTITUDE_REPRISE'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create Expertise table
CREATE TABLE IF NOT EXISTS "Expertise" (
  "id"                         TEXT NOT NULL,
  "personnelId"                TEXT NOT NULL,
  "formulaireId"               TEXT,
  "dateReception"              TIMESTAMP(3),
  "source"                     "ExpertiseSource",
  "motif"                      "ExpertiseMotif",
  "conclusion"                 TEXT,
  "decision"                   "ExpertiseDecision",
  "amenagementRecommandations" TEXT,
  "reclassementPoste"          TEXT,
  "certificatRepriseUrl"       TEXT,
  "dateTransmission"           TIMESTAMP(3),
  "createdAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Expertise_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on formulaireId
CREATE UNIQUE INDEX IF NOT EXISTS "Expertise_formulaireId_key" ON "Expertise"("formulaireId");

-- Index on personnelId
CREATE INDEX IF NOT EXISTS "Expertise_personnelId_idx" ON "Expertise"("personnelId");

-- Foreign keys
ALTER TABLE "Expertise"
  ADD CONSTRAINT "Expertise_personnelId_fkey"
    FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Expertise"
  ADD CONSTRAINT "Expertise_formulaireId_fkey"
    FOREIGN KEY ("formulaireId") REFERENCES "Formulaire"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
