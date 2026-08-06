import { describe, expect, it } from 'vitest';
import { computeProfitScore } from './profit-score.js';

describe('computeProfitScore', () => {
  it('returns 0 for no profit', () => {
    expect(computeProfitScore(0)).toBe(0);
  });

  it('returns 0 for a loss', () => {
    expect(computeProfitScore(-20)).toBe(0);
  });

  it('scales linearly up to the saturation point', () => {
    expect(computeProfitScore(75)).toBe(50);
  });

  it('caps at 100 at or above the saturation ROI', () => {
    expect(computeProfitScore(150)).toBe(100);
    expect(computeProfitScore(300)).toBe(100);
  });
});
