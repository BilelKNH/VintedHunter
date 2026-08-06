import { describe, expect, it } from 'vitest';
import { weightForSource } from './source-weight.js';

describe('weightForSource', () => {
  it('weighs a manually-recorded price higher than an internal comparable', () => {
    expect(weightForSource('manual')).toBeGreaterThan(weightForSource('internal'));
  });

  it('gives internal comparables a baseline weight of 1', () => {
    expect(weightForSource('internal')).toBe(1);
  });
});
