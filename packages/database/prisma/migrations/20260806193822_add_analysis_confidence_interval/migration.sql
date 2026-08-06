-- AlterTable: add nullable first so existing rows can be backfilled before enforcing NOT NULL.
ALTER TABLE "analyses" ADD COLUMN "estimatedValueLow" DOUBLE PRECISION;
ALTER TABLE "analyses" ADD COLUMN "estimatedValueHigh" DOUBLE PRECISION;
ALTER TABLE "analyses" ADD COLUMN "confidence" INTEGER;

-- Backfill existing rows: no interval/confidence was ever computed for them, so collapse the
-- interval to a point at the existing estimate and assign a neutral (mid-scale) confidence,
-- rather than fabricating either from data that was never gathered.
UPDATE "analyses"
SET "estimatedValueLow" = "estimatedValue", "estimatedValueHigh" = "estimatedValue", "confidence" = 50
WHERE "estimatedValueLow" IS NULL;

ALTER TABLE "analyses" ALTER COLUMN "estimatedValueLow" SET NOT NULL;
ALTER TABLE "analyses" ALTER COLUMN "estimatedValueHigh" SET NOT NULL;
ALTER TABLE "analyses" ALTER COLUMN "confidence" SET NOT NULL;
