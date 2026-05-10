CREATE TABLE IF NOT EXISTS "AvisSpecialise" (
    "id"        TEXT NOT NULL,
    "visiteId"  TEXT NOT NULL,
    "nomPrenom" TEXT NOT NULL,
    "dateAvis"  TIMESTAMP(3) NOT NULL,
    "contenu"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvisSpecialise_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AvisSpecialise_visiteId_idx" ON "AvisSpecialise"("visiteId");
ALTER TABLE "AvisSpecialise" ADD CONSTRAINT "AvisSpecialise_visiteId_fkey"
    FOREIGN KEY ("visiteId") REFERENCES "Visite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
