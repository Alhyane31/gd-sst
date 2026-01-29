-- CreateEnum
CREATE TYPE "PersonnelCategorie" AS ENUM ('SMR', 'VP');

-- AlterTable
ALTER TABLE "Personnel" ADD COLUMN     "categorie" "PersonnelCategorie" NOT NULL DEFAULT 'VP',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
