/*
  Warnings:

  - A unique constraint covering the columns `[uniqueid]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "name" TEXT,
ADD COLUMN     "uniqueid" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "user_uniqueid_key" ON "user"("uniqueid");
