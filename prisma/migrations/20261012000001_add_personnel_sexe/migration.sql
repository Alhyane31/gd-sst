-- Sexe du personnel (interprétation du tour de taille, constantes 4.0)
CREATE TYPE "Sexe" AS ENUM ('H', 'F');

ALTER TABLE "Personnel" ADD COLUMN "sexe" "Sexe";
