import { describe, expect, it } from 'vitest';
import { computeConditionScore } from './condition-score.js';

describe('computeConditionScore', () => {
  it('scores "new with tags" conditions at 100', () => {
    expect(computeConditionScore('Neuf avec étiquette')).toBe(100);
    expect(computeConditionScore('New with tags')).toBe(100);
  });

  it('distinguishes "very good" (80) from plain "good" (60)', () => {
    expect(computeConditionScore('Very good')).toBe(80);
    expect(computeConditionScore('Good')).toBe(60);
  });

  it('distinguishes "très bon état" (80) from plain "bon état" (60)', () => {
    expect(computeConditionScore('Très bon état')).toBe(80);
    expect(computeConditionScore('Bon état')).toBe(60);
  });

  it('scores "satisfactory" conditions at 35', () => {
    expect(computeConditionScore('Satisfaisant')).toBe(35);
  });

  it('returns the neutral default for a null condition', () => {
    expect(computeConditionScore(null)).toBe(50);
  });

  it('returns the neutral default for an unrecognized condition string', () => {
    expect(computeConditionScore('Unknown condition text')).toBe(50);
  });

  it('is case-insensitive', () => {
    expect(computeConditionScore('VERY GOOD')).toBe(80);
  });
});
