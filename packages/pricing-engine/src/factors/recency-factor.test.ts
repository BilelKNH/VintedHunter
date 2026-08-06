import { describe, expect, it } from 'vitest';
import { computeRecencyWeight } from './recency-factor.js';

describe('computeRecencyWeight', () => {
  const now = new Date('2026-01-31T00:00:00.000Z');

  it('returns close to 1 for a comparable observed right now', () => {
    expect(computeRecencyWeight(now.toISOString(), now)).toBeCloseTo(1);
  });

  it('halves at the 30-day half-life', () => {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(computeRecencyWeight(thirtyDaysAgo, now)).toBeCloseTo(0.5);
  });

  it('decays further for an older comparable', () => {
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(computeRecencyWeight(sixtyDaysAgo, now)).toBeCloseTo(0.25);
  });

  it('clamps a future observedAt to full weight instead of going above 1', () => {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    expect(computeRecencyWeight(tomorrow, now)).toBe(1);
  });
});
