import { describe, expect, it } from 'vitest';
import { shouldNotify } from './threshold.js';

describe('shouldNotify', () => {
  it('returns true when all three thresholds are cleared', () => {
    expect(shouldNotify({ score: 95, roi: 150, estimatedProfit: 60 })).toBe(true);
  });

  it('defaults to a minimum score of 70 (matching Search.minimumScore) when none is given', () => {
    expect(shouldNotify({ score: 70, roi: 150, estimatedProfit: 60 })).toBe(false);
    expect(shouldNotify({ score: 71, roi: 150, estimatedProfit: 60 })).toBe(true);
  });

  it('gates on the caller-provided minimumScore instead of the default', () => {
    expect(shouldNotify({ score: 85, roi: 150, estimatedProfit: 60 }, 90)).toBe(false);
    expect(shouldNotify({ score: 95, roi: 150, estimatedProfit: 60 }, 90)).toBe(true);
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

  it('enforces the ROI/profit floor even when a search sets an unusually low minimumScore', () => {
    expect(shouldNotify({ score: 20, roi: 10, estimatedProfit: 5 }, 10)).toBe(false);
  });
});
