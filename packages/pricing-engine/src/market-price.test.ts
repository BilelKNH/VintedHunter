import { describe, expect, it } from 'vitest';
import { estimateMarketPrice } from './market-price.js';
import type { ComparableListing, ComparableSource } from './types.js';

const NOW = new Date().toISOString();

function comparable(
  price: number,
  overrides: Partial<{ source: ComparableSource; observedAt: string }> = {},
): ComparableListing {
  return {
    price,
    source: overrides.source ?? 'internal',
    observedAt: overrides.observedAt ?? NOW,
  };
}

describe('estimateMarketPrice', () => {
  it('averages comparable prices as the base', () => {
    const result = estimateMarketPrice(
      [comparable(80), comparable(100), comparable(120)],
      { brand: null, condition: null, fallbackPrice: 999 },
    );

    expect(result.averageComparablePrice).toBe(100);
    expect(result.comparableCount).toBe(3);
    // No brand/condition adjustment, but 3 comparables still add a demand bonus (3*2%=6% of 100).
    expect(result.estimatedValue).toBe(106);
  });

  it('falls back to the listing price when there are no comparables', () => {
    const result = estimateMarketPrice([], { brand: null, condition: null, fallbackPrice: 42 });

    expect(result.averageComparablePrice).toBeNull();
    expect(result.comparableCount).toBe(0);
    expect(result.estimatedValue).toBe(42);
    expect(result.estimatedValueLow).toBe(42);
    expect(result.estimatedValueHigh).toBe(42);
    expect(result.confidence).toBe(0);
  });

  it("ignores brand/condition/demand factors with zero comparables — does not fabricate a discount from the listing's own unverified claims", () => {
    const result = estimateMarketPrice([], {
      brand: 'Stone Island',
      condition: 'Neuf avec étiquette',
      fallbackPrice: 50,
    });

    expect(result.estimatedValue).toBe(50);
    expect(result.brandFactor).toBe(0);
    expect(result.conditionFactor).toBe(0);
    expect(result.demandFactor).toBe(0);
  });

  it('applies brand, condition, and demand factors on top of the average', () => {
    const result = estimateMarketPrice([comparable(100)], {
      brand: 'Stone Island',
      condition: 'Neuf avec étiquette',
      fallbackPrice: 999,
    });

    // base 100, brandFactor +15, conditionFactor +15 (15% of 100), demandFactor +2 (1 comparable, 2%)
    expect(result.brandFactor).toBe(15);
    expect(result.conditionFactor).toBe(15);
    expect(result.demandFactor).toBe(2);
    expect(result.estimatedValue).toBe(132);
  });

  it('never returns a negative estimated value', () => {
    const result = estimateMarketPrice([comparable(10)], {
      brand: null,
      condition: 'Satisfaisant',
      fallbackPrice: 999,
    });

    expect(result.estimatedValue).toBeGreaterThanOrEqual(0);
  });

  it('collapses the interval to a point with a single comparable — no spread to measure', () => {
    const result = estimateMarketPrice([comparable(100)], {
      brand: null,
      condition: null,
      fallbackPrice: 999,
    });

    expect(result.estimatedValueLow).toBe(result.estimatedValue);
    expect(result.estimatedValueHigh).toBe(result.estimatedValue);
  });

  it('widens the interval when comparables disagree, and narrows it when they agree', () => {
    const scattered = estimateMarketPrice([comparable(50), comparable(150)], {
      brand: null,
      condition: null,
      fallbackPrice: 999,
    });
    const tight = estimateMarketPrice([comparable(98), comparable(102)], {
      brand: null,
      condition: null,
      fallbackPrice: 999,
    });

    const scatteredWidth = scattered.estimatedValueHigh - scattered.estimatedValueLow;
    const tightWidth = tight.estimatedValueHigh - tight.estimatedValueLow;
    expect(scatteredWidth).toBeGreaterThan(tightWidth);
  });

  it('pulls the weighted average toward a manual comparable over several internal ones', () => {
    const result = estimateMarketPrice(
      [comparable(100), comparable(100), comparable(100), comparable(160, { source: 'manual' })],
      { brand: null, condition: null, fallbackPrice: 999 },
    );

    // Plain average would be 115; the manual comparable's 1.5x weight pulls it above that.
    expect(result.averageComparablePrice).toBeGreaterThan(115);
  });

  it('gives a higher confidence when a manual comparable is present', () => {
    const withoutManual = estimateMarketPrice([comparable(100), comparable(100)], {
      brand: null,
      condition: null,
      fallbackPrice: 999,
    });
    const withManual = estimateMarketPrice(
      [comparable(100), comparable(100, { source: 'manual' })],
      { brand: null, condition: null, fallbackPrice: 999 },
    );

    expect(withManual.confidence).toBeGreaterThan(withoutManual.confidence);
  });

  it('gives a lower weight, and therefore less influence, to a stale comparable', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const result = estimateMarketPrice(
      [comparable(100), comparable(200, { observedAt: sixtyDaysAgo })],
      { brand: null, condition: null, fallbackPrice: 999 },
    );

    // Plain average would be 150; the stale 200 counts for less, pulling the base below that.
    expect(result.averageComparablePrice).toBeLessThan(150);
  });
});
