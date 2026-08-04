import { describe, expect, it } from 'vitest';
import { computePriceScore } from './price-score.js';

describe('computePriceScore', () => {
  it('returns 50 (neutral) when priced exactly at market value', () => {
    expect(computePriceScore(100, 100)).toBe(50);
  });

  it('returns a higher score the further under market the price is', () => {
    expect(computePriceScore(70, 100)).toBe(80); // 30% discount -> 50 + 30
    expect(computePriceScore(50, 100)).toBe(100); // 50% discount -> clamped at 100
  });

  it('returns a lower score when priced above market value', () => {
    expect(computePriceScore(120, 100)).toBe(30); // -20% discount -> 50 - 20
  });

  it('clamps at 0 for a heavily overpriced listing', () => {
    expect(computePriceScore(300, 100)).toBe(0);
  });

  it('returns 0 when the estimated value is unknown (0 or negative)', () => {
    expect(computePriceScore(50, 0)).toBe(0);
    expect(computePriceScore(50, -10)).toBe(0);
  });
});
