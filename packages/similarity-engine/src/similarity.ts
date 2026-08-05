import type { SimilarityInput } from './types.js';

// Weights from the architecture note: cosine similarity carries most of the signal, structured
// attribute matches nudge it — this keeps two semantically-close-but-different items (e.g. "Nike
// Tech Fleece" vs "Nike Air") from scoring as high as a true match just because embeddings alone
// can drift toward broad category similarity.
const COSINE_WEIGHT = 0.7;
const BRAND_MATCH_WEIGHT = 0.15;
const SIZE_MATCH_WEIGHT = 0.1;
const CATEGORY_MATCH_WEIGHT = 0.05;

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Cannot compare embeddings of different lengths (${a.length} vs ${b.length})`);
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  a.forEach((valueA, i) => {
    const valueB = b[i] as number;
    dot += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  });

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function computeSimilarityScore(input: SimilarityInput): number {
  const cosine = cosineSimilarity(input.embeddingA, input.embeddingB);
  const score =
    cosine * COSINE_WEIGHT +
    (input.brandMatch ? BRAND_MATCH_WEIGHT : 0) +
    (input.sizeMatch ? SIZE_MATCH_WEIGHT : 0) +
    (input.categoryMatch ? CATEGORY_MATCH_WEIGHT : 0);

  return Math.max(0, Math.min(1, score));
}
