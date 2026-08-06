-- Deal Score v2 (7 dimensions): brandScore/conditionScore were computed and persisted but never
-- surfaced anywhere (confirmed via repo-wide grep — zero UI consumers of either column); both
-- are already represented indirectly elsewhere (brand feeds liquidityScore, condition already
-- adjusts estimatedValue upstream in pricing-engine's conditionFactor). Safe to drop outright —
-- this is a dev database with only seed/crawl data, not production.
ALTER TABLE "analyses" DROP COLUMN "brandScore";
ALTER TABLE "analyses" DROP COLUMN "conditionScore";

-- AlterTable: add nullable first so existing rows can be backfilled before enforcing NOT NULL —
-- same precedent as add_target_roi_and_max_buy_price and add_analysis_confidence_interval.
ALTER TABLE "analyses" ADD COLUMN "profitScore" INTEGER;
ALTER TABLE "analyses" ADD COLUMN "competitionScore" INTEGER;
ALTER TABLE "analyses" ADD COLUMN "trendScore" INTEGER;
ALTER TABLE "analyses" ADD COLUMN "seasonScore" INTEGER;

-- Backfill existing rows: none of these sub-scores were ever computed for them, so a neutral
-- midpoint rather than fabricating a real value from data that was never gathered.
UPDATE "analyses"
SET "profitScore" = 50, "competitionScore" = 50, "trendScore" = 50, "seasonScore" = 50
WHERE "profitScore" IS NULL;

ALTER TABLE "analyses" ALTER COLUMN "profitScore" SET NOT NULL;
ALTER TABLE "analyses" ALTER COLUMN "competitionScore" SET NOT NULL;
ALTER TABLE "analyses" ALTER COLUMN "trendScore" SET NOT NULL;
ALTER TABLE "analyses" ALTER COLUMN "seasonScore" SET NOT NULL;
