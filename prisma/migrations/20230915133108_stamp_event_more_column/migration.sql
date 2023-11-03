-- AlterTable
ALTER TABLE "stampEvent" ADD COLUMN     "select_flag" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weekday_bonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weekend_bonus" INTEGER NOT NULL DEFAULT 0;
