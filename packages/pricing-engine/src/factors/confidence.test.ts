import { describe, expect, it } from 'vitest';
import { computeConfidence } from './confidence.js';

describe('computeConfidence', () => {
  it('gives a low score for a single, undated internal comparable', () => {
    const score = computeConfidence({
      comparableCount: 1,
      hasManualSource: false,
      coefficientOfVariation: 0,
    });
    expect(score).toBe(36); // BASE 30 + 1*6
  });

  it('increases with more comparables, up to the cap', () => {
    const few = computeConfidence({ comparableCount: 2, hasManualSource: false, coefficientOfVariation: 0 });
    const many = computeConfidence({ comparableCount: 20, hasManualSource: false, coefficientOfVariation: 0 });
    expect(many).toBeGreaterThan(few);
    expect(many).toBeLessThanOrEqual(100);
  });

  it('rewards having a manual (direct) source', () => {
    const withoutManual = computeConfidence({ comparableCount: 3, hasManualSource: false, coefficientOfVariation: 0 });
    const withManual = computeConfidence({ comparableCount: 3, hasManualSource: true, coefficientOfVariation: 0 });
    expect(withManual).toBe(withoutManual + 15);
  });

  it('penalizes high price dispersion', () => {
    const tight = computeConfidence({ comparableCount: 5, hasManualSource: false, coefficientOfVariation: 0.05 });
    const scattered = computeConfidence({ comparableCount: 5, hasManualSource: false, coefficientOfVariation: 0.5 });
    expect(scattered).toBeLessThan(tight);
  });

  it('clamps to [0, 100]', () => {
    const flooredScore = computeConfidence({
      comparableCount: 0,
      hasManualSource: false,
      coefficientOfVariation: 5,
    });
    expect(flooredScore).toBeGreaterThanOrEqual(0);

    const cappedScore = computeConfidence({
      comparableCount: 50,
      hasManualSource: true,
      coefficientOfVariation: 0,
    });
    expect(cappedScore).toBeLessThanOrEqual(100);
  });
});
