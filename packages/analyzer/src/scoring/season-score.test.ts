import { describe, expect, it } from 'vitest';
import { computeSeasonScore } from './season-score.js';

const WINTER = new Date('2026-01-15T00:00:00.000Z');
const SUMMER = new Date('2026-07-15T00:00:00.000Z');

describe('computeSeasonScore', () => {
  it('returns neutral when there is no category', () => {
    expect(computeSeasonScore(null, WINTER)).toBe(50);
  });

  it('returns neutral for a category with no seasonal match', () => {
    expect(computeSeasonScore('Sac à main', WINTER)).toBe(50);
  });

  it('scores a coat above neutral in winter', () => {
    expect(computeSeasonScore('Manteau', WINTER)).toBeGreaterThan(50);
  });

  it('scores a coat below neutral in summer', () => {
    expect(computeSeasonScore('Manteau', SUMMER)).toBeLessThan(50);
  });

  it('scores swimwear above neutral in summer', () => {
    expect(computeSeasonScore('Maillot de bain', SUMMER)).toBeGreaterThan(50);
  });

  it('matches case-insensitively', () => {
    expect(computeSeasonScore('DOUDOUNE', WINTER)).toBeGreaterThan(50);
  });
});
