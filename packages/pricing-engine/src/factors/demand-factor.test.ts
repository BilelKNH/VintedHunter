import { describe, expect, it } from 'vitest';
import { computeDemandFactor } from './demand-factor.js';

describe('computeDemandFactor', () => {
  it('returns 0 with no comparables', () => {
    expect(computeDemandFactor(0, 100)).toBe(0);
  });

  it('increases with comparable count', () => {
    expect(computeDemandFactor(1, 100)).toBe(2); // 2%
    expect(computeDemandFactor(3, 100)).toBe(6); // 6%
  });

  it('caps at the maximum demand percentage', () => {
    expect(computeDemandFactor(10, 100)).toBe(10); // would be 20% uncapped, capped at 10%
    expect(computeDemandFactor(5, 100)).toBe(10); // exactly at the cap already
  });

  it('scales with the base price', () => {
    expect(computeDemandFactor(1, 200)).toBe(4);
  });

  it('returns 0 when the base price is 0 or negative', () => {
    expect(computeDemandFactor(5, 0)).toBe(0);
  });
});
