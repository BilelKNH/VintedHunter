import { describe, expect, it } from 'vitest';
import { shouldNotify } from './threshold.js';

describe('shouldNotify', () => {
  it('returns true when all three thresholds are cleared', () => {
    expect(shouldNotify({ score: 95, roi: 150, estimatedProfit: 60 })).toBe(true);
  });

  it('returns false when score is at or below 90', () => {
    expect(shouldNotify({ score: 90, roi: 150, estimatedProfit: 60 })).toBe(false);
  });

  it('returns false when roi is at or below 100', () => {
    expect(shouldNotify({ score: 95, roi: 100, estimatedProfit: 60 })).toBe(false);
  });

  it('returns false when profit is at or below 50', () => {
    expect(shouldNotify({ score: 95, roi: 150, estimatedProfit: 50 })).toBe(false);
  });

  it('returns false when nothing clears the bar', () => {
    expect(shouldNotify({ score: 40, roi: 10, estimatedProfit: 5 })).toBe(false);
  });
});
