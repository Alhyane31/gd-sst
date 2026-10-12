-- Pièces jointes des examens (stockage protégé)
CREATE TABLE "PieceJointe" (
    "id" TEXT NOT NULL,
    "visiteId" TEXT NOT NULL,
    "champ" TEXT NOT NULL,
    "nomOriginal" TEXT NOT NULL,
    "chemin" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PieceJointe_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PieceJointe_visiteId_idx" ON "PieceJointe"("visiteId");

ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_visiteId_fkey" FOREIGN KEY ("visiteId") REFERENCES "Visite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
