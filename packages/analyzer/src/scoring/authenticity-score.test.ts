import { describe, expect, it } from 'vitest';
import { computeAuthenticityScore, isSuspiciouslyCheap } from './authenticity-score.js';
import type { SellerInfo } from '../types.js';

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
