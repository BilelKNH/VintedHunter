import { describe, expect, it } from 'vitest';
import { computeCompetitionScore } from './competition-score.js';

describe('computeCompetitionScore', () => {
  it('returns the neutral baseline for zero comparables — thin data, not zero competition', () => {
    expect(computeCompetitionScore(0)).toBe(60);
  });

  it('decreases as more comparables (competition) appear', () => {
    const few = computeCompetitionScore(1);
    const many = computeCompetitionScore(5);
    expect(many).toBeLessThan(few);
    expect(few).toBeLessThan(60);
  });

  it('never goes below zero', () => {
    expect(computeCompetitionScore(1000)).toBeGreaterThanOrEqual(0);
  });
});
