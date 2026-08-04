import type { SellerInfo } from '../types.js';

// Weight: 10% of the overall score — §14.2's authenticity criteria minus "Photos" (needs
// vision/Phase 6): price anomaly, description genericness, and seller trust (§14.2 already
// lists seller history as an authenticity signal, so "Vendeur" 5% is folded in here too — see
// the plan's scoring-weights note).
// Exported: compute-score.ts uses this same threshold to hard-cap the overall score for
// suspiciously-cheap listings (see isSuspiciouslyCheap below) — a weighted-average penalty
// alone isn't enough to keep a likely-fake listing out of the notify path, since priceScore
// (35% weight) rewards the exact same discount that trips this authenticity penalty (10%
// weight, capped at 40 raw points — net swing of only -4 on the 0-100 scale).
export const SUSPICIOUSLY_CHEAP_RATIO = 0.15;
const NOTABLY_CHEAP_RATIO = 0.3;
const CHEAP_PENALTY = 40;
const NOTABLY_CHEAP_PENALTY = 20;
const LOW_QUALITY_DESCRIPTION_PENALTY = 10;

const NEUTRAL_SELLER_TRUST = 50;
const RATING_BASELINE = 3;
const RATING_WEIGHT = 15;
const REVIEWS_DIVISOR = 10;
const MAX_REVIEWS_BONUS = 20;
const RISK_SCORE_WEIGHT = 0.3;

export function isSuspiciouslyCheap(price: number, estimatedValue: number): boolean {
  if (estimatedValue <= 0) {
    return false;
  }
  return price / estimatedValue < SUSPICIOUSLY_CHEAP_RATIO;
}

function priceAnomalyPenalty(price: number, estimatedValue: number): number {
  if (estimatedValue <= 0) {
    return 0;
  }
  const ratio = price / estimatedValue;
  if (ratio < SUSPICIOUSLY_CHEAP_RATIO) {
    return CHEAP_PENALTY;
  }
  if (ratio < NOTABLY_CHEAP_RATIO) {
    return NOTABLY_CHEAP_PENALTY;
  }
  return 0;
}

function sellerTrustScore(seller: SellerInfo | null): number {
  if (!seller) {
    return NEUTRAL_SELLER_TRUST;
  }
  let score = NEUTRAL_SELLER_TRUST;
  if (seller.rating != null) {
    score += (seller.rating - RATING_BASELINE) * RATING_WEIGHT;
  }
  if (seller.reviews != null) {
    score += Math.min(seller.reviews / REVIEWS_DIVISOR, MAX_REVIEWS_BONUS);
  }
  if (seller.riskScore != null) {
    score -= seller.riskScore * RISK_SCORE_WEIGHT;
  }
  return Math.max(0, Math.min(100, score));
}

export function computeAuthenticityScore(params: {
  price: number;
  estimatedValue: number;
  seller: SellerInfo | null;
  descriptionIsLowQuality: boolean;
}): number {
  const trust = sellerTrustScore(params.seller);
  const penalty =
    priceAnomalyPenalty(params.price, params.estimatedValue) +
    (params.descriptionIsLowQuality ? LOW_QUALITY_DESCRIPTION_PENALTY : 0);
  return Math.max(0, Math.min(100, Math.round(trust - penalty)));
}
