/*
  Warnings:

  - Added the required column `maxBuyPrice` to the `analyses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: add nullable first so existing rows can be backfilled before enforcing NOT NULL.
ALTER TABLE "analyses" ADD COLUMN     "maxBuyPrice" DOUBLE PRECISION;

-- Backfill existing rows using the default 30% target margin (Search.targetRoi's own default)
-- since pre-existing Analysis rows predate this column and have no associated search context.
UPDATE "analyses" SET "maxBuyPrice" = "estimatedValue" / 1.30 WHERE "maxBuyPrice" IS NULL;

ALTER TABLE "analyses" ALTER COLUMN "maxBuyPrice" SET NOT NULL;

-- AlterTable
ALTER TABLE "searches" ADD COLUMN     "targetRoi" INTEGER NOT NULL DEFAULT 30;
