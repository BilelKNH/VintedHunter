import { describe, expect, it } from 'vitest';
import { computeSimilarityScore, cosineSimilarity } from './similarity.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it('returns 0 when either vector is all zeros, instead of dividing by zero', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it('throws when vectors have different lengths', () => {
    expect(() => cosineSimilarity([1, 0], [1, 0, 0])).toThrow(/different lengths/);
  });
});

describe('computeSimilarityScore', () => {
  it('scores an exact-embedding, all-attributes-match listing near 1', () => {
    const score = computeSimilarityScore({
      embeddingA: [1, 0],
      embeddingB: [1, 0],
      brandMatch: true,
      sizeMatch: true,
      categoryMatch: true,
    });
    expect(score).toBeCloseTo(1);
  });

  it('weighs cosine similarity above any single structured attribute match', () => {
    const highCosineNoAttributes = computeSimilarityScore({
      embeddingA: [1, 0],
      embeddingB: [1, 0],
      brandMatch: false,
      sizeMatch: false,
      categoryMatch: false,
    });
    const lowCosineAllAttributes = computeSimilarityScore({
      embeddingA: [1, 0],
      embeddingB: [0, 1],
      brandMatch: true,
      sizeMatch: true,
      categoryMatch: true,
    });
    expect(highCosineNoAttributes).toBeGreaterThan(lowCosineAllAttributes);
  });

  it('clamps the result to [0, 1] even with a negative cosine component', () => {
    const score = computeSimilarityScore({
      embeddingA: [1, 0],
      embeddingB: [-1, 0],
      brandMatch: false,
      sizeMatch: false,
      categoryMatch: false,
    });
    expect(score).toBe(0);
  });
});
