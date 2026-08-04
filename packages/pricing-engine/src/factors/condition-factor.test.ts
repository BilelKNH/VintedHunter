import { describe, expect, it } from 'vitest';
import { computeConditionFactor } from './condition-factor.js';

describe('computeConditionFactor', () => {
  it('adds a premium for "new with tags"', () => {
    expect(computeConditionFactor('Neuf avec étiquette', 100)).toBe(15);
  });

  it('has no adjustment for "very good"', () => {
    expect(computeConditionFactor('Very good', 100)).toBe(0);
  });

  it('subtracts for "good"', () => {
    expect(computeConditionFactor('Bon état', 100)).toBe(-10);
  });

  it('subtracts more for "satisfactory"', () => {
    expect(computeConditionFactor('Satisfaisant', 100)).toBe(-25);
  });

  it('scales with the base price', () => {
    expect(computeConditionFactor('Neuf avec étiquette', 200)).toBe(30);
  });

  it('returns 0 when condition is null', () => {
    expect(computeConditionFactor(null, 100)).toBe(0);
  });

  it('returns 0 when the base price is 0 or negative', () => {
    expect(computeConditionFactor('Neuf avec étiquette', 0)).toBe(0);
    expect(computeConditionFactor('Neuf avec étiquette', -50)).toBe(0);
  });
});
