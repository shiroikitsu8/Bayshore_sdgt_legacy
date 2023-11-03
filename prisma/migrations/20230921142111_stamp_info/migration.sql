/*
  Warnings:

  - You are about to drop the column `last_daily_dt` on the `stampEvent` table. All the data in the column will be lost.
  - You are about to drop the column `last_weekly_dt` on the `stampEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stampEvent" DROP COLUMN "last_daily_dt",
DROP COLUMN "last_weekly_dt";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "last_daily_bingo_dt" INTEGER,
ADD COLUMN     "last_weekly_bingo_dt" INTEGER;
