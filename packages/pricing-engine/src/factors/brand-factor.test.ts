import { describe, expect, it } from 'vitest';
import { computeBrandFactor } from './brand-factor.js';

describe('computeBrandFactor', () => {
  it('gives a high bonus for a high-value brand', () => {
    expect(computeBrandFactor('Stone Island')).toBe(15);
  });

  it('gives a smaller bonus for a mid-value brand', () => {
    expect(computeBrandFactor('Carhartt')).toBe(5);
  });

  it('gives no bonus for an unrecognized brand', () => {
    expect(computeBrandFactor('Zara')).toBe(0);
  });

  it('gives no bonus when brand is null', () => {
    expect(computeBrandFactor(null)).toBe(0);
  });
});
