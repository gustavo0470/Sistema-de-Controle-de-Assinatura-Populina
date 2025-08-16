/*
  Warnings:

  - A unique constraint covering the columns `[incremental_id]` on the table `signatures` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "signatures" ADD COLUMN     "incremental_id" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "signatures_incremental_id_key" ON "signatures"("incremental_id");
