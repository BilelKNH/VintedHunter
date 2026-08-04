import { describe, expect, it } from 'vitest';
import { hashUrl, hasContentChanged } from './duplicate-detector.js';

describe('hashUrl', () => {
  it('produces the same hash for URLs differing only by trailing slash', () => {
    expect(hashUrl('https://vinted.fr/items/1/')).toBe(hashUrl('https://vinted.fr/items/1'));
  });

  it('produces the same hash for URLs differing only by case', () => {
    expect(hashUrl('https://Vinted.fr/items/1')).toBe(hashUrl('https://vinted.fr/items/1'));
  });

  it('produces different hashes for different URLs', () => {
    expect(hashUrl('https://vinted.fr/items/1')).not.toBe(hashUrl('https://vinted.fr/items/2'));
  });
});

describe('hasContentChanged', () => {
  it('returns false for identical hashes', () => {
    expect(hasContentChanged('abc', 'abc')).toBe(false);
  });

  it('returns true for different hashes', () => {
    expect(hasContentChanged('abc', 'def')).toBe(true);
  });
});
