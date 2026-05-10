const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS "AvisSpecialise" (
      "id"        TEXT NOT NULL,
      "visiteId"  TEXT NOT NULL,
      "nomPrenom" TEXT NOT NULL,
      "dateAvis"  TIMESTAMP(3) NOT NULL,
      "contenu"   TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AvisSpecialise_pkey" PRIMARY KEY ("id")
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS "AvisSpecialise_visiteId_idx" ON "AvisSpecialise"("visiteId")`);
  await client.query(`
    DO $$ BEGIN
      ALTER TABLE "AvisSpecialise" ADD CONSTRAINT "AvisSpecialise_visiteId_fkey"
        FOREIGN KEY ("visiteId") REFERENCES "Visite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);

  console.log('Done!');
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
