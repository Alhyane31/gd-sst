-- CreateEnum
CREATE TYPE "CategorieForm" AS ENUM ('A', 'B', 'C', 'D');

-- AlterTable
ALTER TABLE "Poste" ADD COLUMN     "categorieForm" "CategorieForm",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PosteDetail" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "posteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosteDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PosteDetail_code_key" ON "PosteDetail"("code");

-- CreateIndex
CREATE INDEX "PosteDetail_posteId_idx" ON "PosteDetail"("posteId");

-- AddForeignKey
ALTER TABLE "PosteDetail" ADD CONSTRAINT "PosteDetail_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "Poste"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
