/*
  Warnings:

  - You are about to drop the column `actif` on the `Personnel` table. All the data in the column will be lost.
  - You are about to drop the column `nom` on the `Personnel` table. All the data in the column will be lost.
  - You are about to drop the column `prenom` on the `Personnel` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Personnel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Personnel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Personnel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Personnel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Personnel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Personnel" DROP COLUMN "actif",
DROP COLUMN "nom",
DROP COLUMN "prenom",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "formation" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_email_key" ON "Personnel"("email");
