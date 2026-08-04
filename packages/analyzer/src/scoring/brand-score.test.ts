import { describe, expect, it } from 'vitest';
import { computeBrandScore } from './brand-score.js';

describe('computeBrandScore', () => {
  it('scores a high-value brand at 95', () => {
    expect(computeBrandScore('Stone Island')).toBe(95);
    expect(computeBrandScore('Nike Tech Fleece')).toBe(95);
  });

  it('scores a mid-value brand at 70', () => {
    expect(computeBrandScore('Carhartt')).toBe(70);
  });

  it('scores an unrecognized brand at 40', () => {
    expect(computeBrandScore('Zara')).toBe(40);
  });

  it('scores a missing brand at 20', () => {
    expect(computeBrandScore(null)).toBe(20);
  });

  it('is case-insensitive', () => {
    expect(computeBrandScore('nike tech fleece')).toBe(95);
  });
});
