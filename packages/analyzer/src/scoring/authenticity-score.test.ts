import { describe, expect, it } from 'vitest';
import {
  computeAuthenticityScore,
  isCounterfeitFlagged,
  isSuspiciouslyCheap,
} from './authenticity-score.js';
import type { SellerInfo, VisionSignals } from '../types.js';

function seller(overrides: Partial<SellerInfo> = {}): SellerInfo {
  return {
    rating: null,
    reviews: null,
    accountAge: null,
    totalListings: null,
    riskScore: null,
    ...overrides,
  };
}

function vision(overrides: Partial<VisionSignals> = {}): VisionSignals {
  return {
    photoQualityScore: null,
    defects: [],
    extractedLabelText: [],
    brandLogoConsistent: null,
    counterfeitRiskFlags: [],
    ...overrides,
  };
}

describe('computeAuthenticityScore', () => {
  it('returns neutral (50) for a listing at market price with no seller data', () => {
    const score = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
    });
    expect(score).toBe(50);
  });

  it('penalizes a suspiciously cheap price relative to market value', () => {
    const score = computeAuthenticityScore({
      price: 10,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
    });
    expect(score).toBe(10); // 50 - 40 (ratio 0.1 < 0.15 -> full penalty)
  });

  it('applies a smaller penalty for a notably-but-not-suspiciously cheap price', () => {
    const score = computeAuthenticityScore({
      price: 20,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
    });
    expect(score).toBe(30); // 50 - 20 (ratio 0.2, between 0.15 and 0.3)
  });

  it('boosts the score for a well-rated, reviewed seller', () => {
    const score = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: seller({ rating: 5, reviews: 200 }),
      descriptionIsLowQuality: false,
    });
    expect(score).toBe(100); // 50 + (5-3)*15=30 + min(200/10,20)=20 -> 100, clamped
  });

  it('penalizes a high seller risk score', () => {
    const score = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: seller({ riskScore: 60 }),
      descriptionIsLowQuality: false,
    });
    expect(score).toBe(32); // 50 - 60*0.3 = 32
  });

  it('applies the low-quality-description penalty', () => {
    const score = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: true,
    });
    expect(score).toBe(40); // 50 - 10
  });

  it('clamps at 0 for a heavily penalized listing', () => {
    const score = computeAuthenticityScore({
      price: 5,
      estimatedValue: 100,
      seller: seller({ riskScore: 100 }),
      descriptionIsLowQuality: true,
    });
    expect(score).toBe(0);
  });

  it('is unaffected when no vision signals are provided (regression guard)', () => {
    const withoutVision = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
    });
    const withNullVision = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
      vision: null,
    });
    expect(withoutVision).toBe(50);
    expect(withNullVision).toBe(50);
  });

  it('penalizes a brand/logo mismatch detected in photos', () => {
    const score = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
      vision: vision({ brandLogoConsistent: false }),
    });
    expect(score).toBe(20); // 50 - 30
  });

  it('penalizes any counterfeit-risk flag from vision', () => {
    const score = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
      vision: vision({ counterfeitRiskFlags: ['Police du logo incorrecte'] }),
    });
    expect(score).toBe(30); // 50 - 20
  });

  it('penalizes a low photo quality score', () => {
    const score = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
      vision: vision({ photoQualityScore: 10 }),
    });
    expect(score).toBe(40); // 50 - 10
  });

  it('does not penalize a photo quality score at or above the threshold', () => {
    const score = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
      vision: vision({ photoQualityScore: 30 }),
    });
    expect(score).toBe(50);
  });

  it('does not penalize when brandLogoConsistent is true or null', () => {
    const consistentScore = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
      vision: vision({ brandLogoConsistent: true }),
    });
    const unknownScore = computeAuthenticityScore({
      price: 100,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: false,
      vision: vision({ brandLogoConsistent: null }),
    });
    expect(consistentScore).toBe(50);
    expect(unknownScore).toBe(50);
  });

  it('stacks vision penalties with the existing price/description penalties', () => {
    const score = computeAuthenticityScore({
      price: 10,
      estimatedValue: 100,
      seller: null,
      descriptionIsLowQuality: true,
      vision: vision({ brandLogoConsistent: false }),
    });
    expect(score).toBe(0); // 50 - 40 (cheap) - 10 (description) - 30 (logo), clamped at 0
  });
});

describe('isCounterfeitFlagged', () => {
  it('returns false when no vision signals are provided', () => {
    expect(isCounterfeitFlagged(null)).toBe(false);
    expect(isCounterfeitFlagged(undefined)).toBe(false);
  });

  it('returns true when the brand/logo is inconsistent', () => {
    expect(isCounterfeitFlagged(vision({ brandLogoConsistent: false }))).toBe(true);
  });

  it('returns true when any counterfeit-risk flag is present', () => {
    expect(isCounterfeitFlagged(vision({ counterfeitRiskFlags: ['Couture suspecte'] }))).toBe(
      true,
    );
  });

  it('returns false when the logo is consistent and no flags are present', () => {
    expect(isCounterfeitFlagged(vision({ brandLogoConsistent: true }))).toBe(false);
    expect(isCounterfeitFlagged(vision())).toBe(false);
  });
});

describe('isSuspiciouslyCheap', () => {
  it('returns true below the suspiciously-cheap ratio', () => {
    expect(isSuspiciouslyCheap(10, 100)).toBe(true);
  });

  it('returns false at or above the suspiciously-cheap ratio', () => {
    expect(isSuspiciouslyCheap(15, 100)).toBe(false);
    expect(isSuspiciouslyCheap(50, 100)).toBe(false);
  });

  it('returns false when the estimated value is unknown', () => {
    expect(isSuspiciouslyCheap(10, 0)).toBe(false);
  });
});
