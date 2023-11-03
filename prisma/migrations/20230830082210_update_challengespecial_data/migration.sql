-- AlterTable
ALTER TABLE "challengeModeResult" ADD COLUMN     "play_dt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "store" TEXT NOT NULL DEFAULT 'Bayshore';

-- AlterTable
ALTER TABLE "specialModeResult" ADD COLUMN     "play_dt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "store" TEXT NOT NULL DEFAULT 'Bayshore';
