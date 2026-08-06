import { analyzeTitle, type TitleAnalysis } from '../title-analysis.js';
import { analyzeDescriptionQuality, type DescriptionQuality } from '../description-quality.js';
import { detectSellerKeywords, type SellerKeywordSignal } from '../seller-keywords.js';
import { detectTitleErrors, type ErrorDetectionResult } from '../error-detection.js';
import type { AnalysisInput, AnalysisResult, Recommendation } from '../types.js';
import { computePriceScore } from './price-score.js';
import { computeLiquidityScore } from './liquidity-score.js';
import { computeProfitScore } from './profit-score.js';
import { computeCompetitionScore } from './competition-score.js';
import { computeTrendScore } from './trend-score.js';
import { computeSeasonScore } from './season-score.js';
import {
  computeAuthenticityScore,
  isCounterfeitFlagged,
  isSuspiciouslyCheap,
} from './authenticity-score.js';

// Deal Score v2 (7 dimensions) — replaces the original 5 (price/brand/condition/liquidity/
// authenticity). brandScore/conditionScore are dropped: both were computed and persisted but
// never surfaced anywhere (grepped the whole repo — zero UI consumers), and both are already
// represented indirectly (brand desirability feeds liquidityScore via computeBrandScore;
// condition already adjusts market.estimatedValue upstream in packages/pricing-engine's
// conditionFactor, which priceScore compares against). "Demand" from the original architecture
// note is deliberately not a separate dimension from Liquidity — both would compute from the
// identical comparableCount signal with no sold-listings data to tell them apart.
const WEIGHTS = {
  price: 0.25,
  profit: 0.2,
  liquidity: 0.2,
  authenticity: 0.15, // "Risk" in product terms — same computation, field name kept to avoid churn
  competition: 0.1,
  trend: 0.05,
  season: 0.05,
};

// A weighted average alone isn't enough to keep a likely-fake listing out of the notify path:
// priceScore and profitScore (25%+20% weight, and both move together — a steep discount inflates
// both) reward the exact same discount that trips authenticityScore's suspiciously-cheap penalty
// (only 15% weight, capped at 40 raw points — a small net swing on the 0-100 scale). Hard-cap
// below GOOD_OPPORTUNITY/STRONG_BUY instead so a suspiciously-cheap listing always lands at
// WATCH-or-lower for manual review.
const SUSPICIOUSLY_CHEAP_SCORE_CAP = 65;

// Phase 6 (§14/§62): a logo/brand mismatch or an explicit counterfeit-risk flag from Claude
// Vision is a stronger fake signal than price alone (same net-swing problem as above —
// authenticityScore's vision penalty is capped at -30/-20 within only a 15%-weighted
// sub-score), so it gets a lower, separate cap. Both caps can apply; compute-score takes the
// minimum.
const COUNTERFEIT_FLAGGED_SCORE_CAP = 50;

// §16 action bands. Exported (not just used internally) because the Analysis DB model has no
// `recommendation` column — it's purely derived from `score`, so callers that only have a
// persisted score (e.g. apps/api reading a stored Analysis row) can still get the same banding
// without recomputing a full analysis.
export function recommendationForScore(score: number): Recommendation {
  if (score < 50) {
    return 'IGNORE';
  }
  if (score < 75) {
    return 'WATCH';
  }
  if (score < 90) {
    return 'GOOD_OPPORTUNITY';
  }
  return 'STRONG_BUY';
}

function buildExplanation(
  input: AnalysisInput,
  titleAnalysis: TitleAnalysis,
  descriptionQuality: DescriptionQuality,
  sellerKeywords: SellerKeywordSignal,
  errorDetection: ErrorDetectionResult,
  roi: number,
  maxBuyPrice: number,
  targetRoi: number,
  suspiciouslyCheap: boolean,
  counterfeitFlagged: boolean,
): string[] {
  const explanation: string[] = [];
  const { listing, market, vision } = input;

  if (suspiciouslyCheap) {
    explanation.push(
      "⚠️ Prix anormalement bas par rapport au marché — vérifier l'authenticité avant achat",
    );
  }
  if (counterfeitFlagged) {
    explanation.push('⚠️ Signaux de contrefaçon détectés sur les photos — vérifier avant achat');
  }
  if (vision?.defects.length) {
    explanation.push(`Défauts visibles sur les photos : ${vision.defects.join(', ')}`);
  }
  if (vision?.extractedLabelText.length) {
    explanation.push(`Texte relevé sur les étiquettes : ${vision.extractedLabelText.join(', ')}`);
  }

  if (market.estimatedValue > 0) {
    const discountPct = Math.round(
      ((market.estimatedValue - listing.price) / market.estimatedValue) * 100,
    );
    if (discountPct > 0) {
      explanation.push(`Prix ${discountPct}% sous la valeur marché estimée`);
    } else if (discountPct < 0) {
      explanation.push(`Prix ${Math.abs(discountPct)}% au-dessus de la valeur marché estimée`);
    }
  }

  if (titleAnalysis.probableCollection) {
    explanation.push(`Collection probable : ${titleAnalysis.probableCollection}`);
  }
  if (descriptionQuality.isLowQuality) {
    explanation.push('Description sous-optimisée — potentiel de sous-évaluation');
  }
  if (sellerKeywords.hasUrgencySignal) {
    explanation.push('Vendeur pressé — marge de négociation possible');
  }
  if (errorDetection.suggestedBrandCorrection) {
    explanation.push(
      `Faute probable dans le titre — marque suggérée : ${errorDetection.suggestedBrandCorrection}`,
    );
  }
  if (listing.seller?.rating != null) {
    explanation.push(
      `Vendeur noté ${listing.seller.rating}/5 (${listing.seller.reviews ?? 0} avis)`,
    );
  }
  explanation.push(`ROI estimé : ${Math.round(roi)}%`);
  explanation.push(
    `Prix d'achat max recommandé (marge ${targetRoi}%) : ${maxBuyPrice.toFixed(2)}€`,
  );

  return explanation;
}

// maxBuyPrice solves for the price P where (estimatedValue - P) / P = targetRoi/100 — i.e. the
// highest price that still clears the target margin on a resale at estimatedValue. Clamped to 0
// since a targetRoi <= -100 would otherwise divide by <= 0 or go negative.
function computeMaxBuyPrice(estimatedValue: number, targetRoi: number): number {
  return Math.max(0, estimatedValue / (1 + targetRoi / 100));
}

export function computeAnalysis(input: AnalysisInput): AnalysisResult {
  const { listing, market, targetRoi } = input;

  const titleAnalysis = analyzeTitle(listing.title, listing.brand);
  const descriptionQuality = analyzeDescriptionQuality(listing.description);
  const sellerKeywords = detectSellerKeywords(listing.title, listing.description);
  const errorDetection = detectTitleErrors(listing.title, listing.brand);

  // Computed before the weighted sum below — profitScore needs roi.
  const estimatedProfit = market.estimatedValue - listing.price;
  const roi = listing.price > 0 ? (estimatedProfit / listing.price) * 100 : 0;
  const maxBuyPrice = computeMaxBuyPrice(market.estimatedValue, targetRoi);

  const priceScore = computePriceScore(listing.price, market.estimatedValue);
  const profitScore = computeProfitScore(roi);
  const liquidityScore = computeLiquidityScore(listing.brand, market.comparableCount);
  const authenticityScore = computeAuthenticityScore({
    price: listing.price,
    estimatedValue: market.estimatedValue,
    seller: listing.seller,
    descriptionIsLowQuality: descriptionQuality.isLowQuality,
    vision: input.vision,
  });
  const competitionScore = computeCompetitionScore(market.comparableCount);
  const trendScore = computeTrendScore(input.priceHistory, listing.price);
  const seasonScore = computeSeasonScore(listing.category);

  const rawScore = Math.round(
    priceScore * WEIGHTS.price +
      profitScore * WEIGHTS.profit +
      liquidityScore * WEIGHTS.liquidity +
      authenticityScore * WEIGHTS.authenticity +
      competitionScore * WEIGHTS.competition +
      trendScore * WEIGHTS.trend +
      seasonScore * WEIGHTS.season,
  );

  const suspiciouslyCheap = isSuspiciouslyCheap(listing.price, market.estimatedValue);
  const counterfeitFlagged = isCounterfeitFlagged(input.vision);
  let score = rawScore;
  if (suspiciouslyCheap) {
    score = Math.min(score, SUSPICIOUSLY_CHEAP_SCORE_CAP);
  }
  if (counterfeitFlagged) {
    score = Math.min(score, COUNTERFEIT_FLAGGED_SCORE_CAP);
  }

  return {
    score,
    priceScore,
    profitScore,
    liquidityScore,
    authenticityScore,
    competitionScore,
    trendScore,
    seasonScore,
    estimatedValue: market.estimatedValue,
    estimatedValueLow: market.estimatedValueLow,
    estimatedValueHigh: market.estimatedValueHigh,
    confidence: market.confidence,
    estimatedProfit,
    roi,
    maxBuyPrice,
    recommendation: recommendationForScore(score),
    explanation: buildExplanation(
      input,
      titleAnalysis,
      descriptionQuality,
      sellerKeywords,
      errorDetection,
      roi,
      maxBuyPrice,
      targetRoi,
      suspiciouslyCheap,
      counterfeitFlagged,
    ),
    photoQualityScore: input.vision?.photoQualityScore ?? null,
    defects: input.vision?.defects ?? [],
    extractedLabelText: input.vision?.extractedLabelText ?? [],
    brandLogoConsistent: input.vision?.brandLogoConsistent ?? null,
    counterfeitRiskFlags: input.vision?.counterfeitRiskFlags ?? [],
  };
}
