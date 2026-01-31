/*
  Warnings:

  - You are about to drop the column `type` on the `Convocation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Convocation_type_idx";

-- AlterTable
ALTER TABLE "Convocation" DROP COLUMN "type";
