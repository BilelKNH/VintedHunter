import { describe, expect, it } from 'vitest';
import { analyzeDescriptionQuality } from './description-quality.js';

describe('analyzeDescriptionQuality', () => {
  it('flags a missing description', () => {
    const result = analyzeDescriptionQuality(null);

    expect(result.isLowQuality).toBe(true);
    expect(result.reasons).toContain('Aucune description');
  });

  it('flags an empty/whitespace-only description', () => {
    const result = analyzeDescriptionQuality('   ');

    expect(result.isLowQuality).toBe(true);
  });

  it('flags a very short description', () => {
    const result = analyzeDescriptionQuality('Bon état');

    expect(result.isLowQuality).toBe(true);
    expect(result.reasons).toContain('Description très courte');
  });

  it('flags a short generic-only description even above the length floor', () => {
    const result = analyzeDescriptionQuality(
      'Bon état, taille M, comme neuf, jamais porté vraiment',
    );

    expect(result.isLowQuality).toBe(true);
    expect(result.reasons).toContain('Description générique');
  });

  it('does not flag a detailed, specific description', () => {
    const result = analyzeDescriptionQuality(
      'Acheté en boutique Nike en 2022, porté deux fois seulement, aucune tache ni accroc, coupe regular taille L, étiquette conservée avec référence produit.',
    );

    expect(result.isLowQuality).toBe(false);
    expect(result.reasons).toEqual([]);
  });
});
