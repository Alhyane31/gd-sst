-- CreateEnum
CREATE TYPE "VentilationQualite" AS ENUM ('BONNE', 'MOYENNE', 'INSUFFISANTE', 'NULLE');
CREATE TYPE "EclairageType" AS ENUM ('NATUREL', 'ARTIFICIEL', 'MIXTE');
CREATE TYPE "EclairageSuffisance" AS ENUM ('BON', 'MOYEN', 'INSUFFISANT');

-- CreateTable
CREATE TABLE "EtudeDePoste" (
    "id"                        TEXT NOT NULL,
    "visiteId"                  TEXT NOT NULL,
    "personnelId"               TEXT NOT NULL,
    "etudeEnvisagee"            BOOLEAN,
    "dateEnvoiDemande"          TIMESTAMP(3),
    "dureeCycleMinutes"         INTEGER,
    "descriptionCycle"          TEXT,
    "nombrePatientsActes"       INTEGER,
    "niveauBruitDb"             DOUBLE PRECISION,
    "humiditeRelative"          DOUBLE PRECISION,
    "ventilation"               "VentilationQualite",
    "commentaireEnvironnement"  TEXT,
    "eclairageType"             "EclairageType",
    "eclairageSuffisance"       "EclairageSuffisance",
    "eclairementLux"            DOUBLE PRECISION,
    "chargePhysiqueUrl"         TEXT,
    "chargeMentaleUrl"          TEXT,
    "commentaireFinal"          TEXT,
    "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EtudeDePoste_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EtudeDePoste_visiteId_key" ON "EtudeDePoste"("visiteId");
CREATE INDEX "EtudeDePoste_visiteId_idx" ON "EtudeDePoste"("visiteId");
CREATE INDEX "EtudeDePoste_personnelId_idx" ON "EtudeDePoste"("personnelId");

-- AddForeignKey
ALTER TABLE "EtudeDePoste" ADD CONSTRAINT "EtudeDePoste_visiteId_fkey"
    FOREIGN KEY ("visiteId") REFERENCES "Visite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EtudeDePoste" ADD CONSTRAINT "EtudeDePoste_personnelId_fkey"
    FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
