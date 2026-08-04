import { describe, expect, it } from 'vitest';
import { analyzeTitle } from './title-analysis.js';

describe('analyzeTitle', () => {
  it('detects a known collection from a title keyword', () => {
    const result = analyzeTitle('Nike Tech Fleece Hoodie Grey', 'Nike');

    expect(result.detectedBrand).toBe('Nike');
    expect(result.probableCollection).toBe('Tech Fleece');
    expect(result.confidence).toBe(100);
  });

  it('is case-insensitive when matching the collection hint', () => {
    const result = analyzeTitle('nike TECH fleece hoodie', 'Nike');

    expect(result.probableCollection).toBe('Tech Fleece');
  });

  it('returns no collection when the brand has no matching hint', () => {
    const result = analyzeTitle('Nike Air Max sneakers', 'Nike');

    expect(result.probableCollection).toBeNull();
  });

  it('returns a low baseline confidence for a short title with no known brand', () => {
    const result = analyzeTitle('Pull noir', null);

    expect(result.detectedBrand).toBeNull();
    expect(result.probableCollection).toBeNull();
    expect(result.confidence).toBe(30); // baseline only — 2 words, no descriptive-title bonus
  });

  it('adds a descriptive-title bonus for titles with 3+ words', () => {
    const result = analyzeTitle('Pull noir taille M', null);

    expect(result.confidence).toBe(45); // baseline 30 + descriptive-title bonus 15
  });

  it('caps confidence at 100', () => {
    const result = analyzeTitle('Nike Tech Fleece Hoodie Grey Large', 'Nike');

    expect(result.confidence).toBeLessThanOrEqual(100);
  });
});
