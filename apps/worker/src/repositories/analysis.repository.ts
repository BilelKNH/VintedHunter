import type { AnalysisResult } from '@vinted-hunter/analyzer';
import type { Analysis, PrismaClient } from '@vinted-hunter/database';

export interface AnalysisRepository {
  upsertForListing(listingId: string, result: AnalysisResult): Promise<Analysis>;
  findByListingId(listingId: string): Promise<Analysis | null>;
}

// The Analysis model has no `recommendation` column — it's derived purely from `score` (see
// @vinted-hunter/analyzer's recommendationForScore), so it isn't persisted here.
export function createAnalysisRepository(prisma: PrismaClient): AnalysisRepository {
  return {
    upsertForListing(listingId, result) {
      // photoQualityScore is only ever null when vision analysis didn't run (compute-score.ts's
      // default) — ai-engine's schema requires a real 0-100 value whenever it did — so it
      // doubles as the "was vision analysis run" signal for visionAnalyzedAt.
      const visionAnalyzedAt = result.photoQualityScore !== null ? new Date() : null;
      const data = {
        score: result.score,
        priceScore: result.priceScore,
        brandScore: result.brandScore,
        conditionScore: result.conditionScore,
        liquidityScore: result.liquidityScore,
        authenticityScore: result.authenticityScore,
        estimatedValue: result.estimatedValue,
        estimatedProfit: result.estimatedProfit,
        roi: result.roi,
        maxBuyPrice: result.maxBuyPrice,
        explanation: result.explanation,
        photoQualityScore: result.photoQualityScore,
        defects: result.defects,
        extractedLabelText: result.extractedLabelText,
        brandLogoConsistent: result.brandLogoConsistent,
        counterfeitRiskFlags: result.counterfeitRiskFlags,
        visionAnalyzedAt,
      };
      return prisma.analysis.upsert({
        where: { listingId },
        create: { listingId, ...data },
        update: data,
      });
    },

    findByListingId(listingId) {
      return prisma.analysis.findUnique({ where: { listingId } });
    },
  };
}
