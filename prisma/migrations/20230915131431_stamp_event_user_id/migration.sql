/*
  Warnings:

  - Added the required column `user_id` to the `stampEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stampEvent" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "stampEvent" ADD CONSTRAINT "stampEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
