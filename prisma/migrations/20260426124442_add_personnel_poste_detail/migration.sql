-- AlterTable
ALTER TABLE "Personnel" ADD COLUMN     "posteDetailId" TEXT;

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_posteDetailId_fkey" FOREIGN KEY ("posteDetailId") REFERENCES "PosteDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;
