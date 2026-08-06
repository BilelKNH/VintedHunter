import { describe, expect, it } from 'vitest';
import { computeTrendScore } from './trend-score.js';

describe('computeTrendScore', () => {
  it('returns neutral when there is no price history yet', () => {
    expect(computeTrendScore([], 50)).toBe(50);
  });

  it('scores above neutral when the price has been cut since it was first listed', () => {
    expect(computeTrendScore([80], 60)).toBeGreaterThan(50);
  });

  it('stays neutral when the price has risen', () => {
    expect(computeTrendScore([60], 80)).toBe(50);
  });

  it('stays neutral when the price is unchanged', () => {
    expect(computeTrendScore([60], 60)).toBe(50);
  });
});
