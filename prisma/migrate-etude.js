const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const queries = [
    `DO $$ BEGIN CREATE TYPE "VentilationQualite" AS ENUM ('BONNE','MOYENNE','INSUFFISANTE','NULLE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE "EclairageType" AS ENUM ('NATUREL','ARTIFICIEL','MIXTE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE "EclairageSuffisance" AS ENUM ('BON','MOYEN','INSUFFISANT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `CREATE TABLE IF NOT EXISTS "EtudeDePoste" (
      "id" TEXT NOT NULL,
      "visiteId" TEXT NOT NULL,
      "personnelId" TEXT NOT NULL,
      "etudeEnvisagee" BOOLEAN,
      "dateEnvoiDemande" TIMESTAMP(3),
      "dureeCycleMinutes" INTEGER,
      "descriptionCycle" TEXT,
      "nombrePatientsActes" INTEGER,
      "niveauBruitDb" DOUBLE PRECISION,
      "humiditeRelative" DOUBLE PRECISION,
      "ventilation" "VentilationQualite",
      "commentaireEnvironnement" TEXT,
      "eclairageType" "EclairageType",
      "eclairageSuffisance" "EclairageSuffisance",
      "eclairementLux" DOUBLE PRECISION,
      "chargePhysiqueUrl" TEXT,
      "chargeMentaleUrl" TEXT,
      "commentaireFinal" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EtudeDePoste_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "EtudeDePoste_visiteId_key" ON "EtudeDePoste"("visiteId")`,
    `CREATE INDEX IF NOT EXISTS "EtudeDePoste_visiteId_idx" ON "EtudeDePoste"("visiteId")`,
    `CREATE INDEX IF NOT EXISTS "EtudeDePoste_personnelId_idx" ON "EtudeDePoste"("personnelId")`,
    `DO $$ BEGIN ALTER TABLE "EtudeDePoste" ADD CONSTRAINT "EtudeDePoste_visiteId_fkey" FOREIGN KEY ("visiteId") REFERENCES "Visite"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE "EtudeDePoste" ADD CONSTRAINT "EtudeDePoste_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  ];

  for (const q of queries) {
    await client.query(q);
    process.stdout.write('.');
  }
  console.log('\nDone!');
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
