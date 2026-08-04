import { describe, expect, it } from 'vitest';
import { computeLiquidityScore } from './liquidity-score.js';

describe('computeLiquidityScore', () => {
  it('scores a hot brand with no comparables using only the brand component', () => {
    // Stone Island brandScore=95 -> 95*0.7 = 66.5 -> rounds to 67
    expect(computeLiquidityScore('Stone Island', 0)).toBe(67);
  });

  it('adds an activity bonus for comparable listings found', () => {
    expect(computeLiquidityScore('Stone Island', 2)).toBe(77); // 67 + 2*5
  });

  it('caps the activity bonus', () => {
    const withCap = computeLiquidityScore('Stone Island', 10); // 10*5=50, capped at 30
    const withMax = computeLiquidityScore('Stone Island', 6); // 6*5=30, at the cap already
    expect(withCap).toBe(withMax);
  });

  it('scores low for an unrecognized brand with no market activity', () => {
    expect(computeLiquidityScore('Zara', 0)).toBe(28); // 40*0.7 = 28
  });

  it('stays within 0-100 bounds', () => {
    const score = computeLiquidityScore('Stone Island', 100);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
