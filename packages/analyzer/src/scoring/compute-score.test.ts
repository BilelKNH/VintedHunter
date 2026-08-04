import { describe, expect, it } from 'vitest';
import { computeAnalysis } from './compute-score.js';
import type { AnalysisInput, VisionSignals } from '../types.js';

function baseInput(
  overrides: Partial<AnalysisInput['listing']> = {},
  market: Partial<AnalysisInput['market']> = {},
  vision: AnalysisInput['vision'] = undefined,
): AnalysisInput {
  return {
    listing: {
      title: 'Stone Island Shadow Project Jacket',
      description:
        'Achetée en boutique en 2023, portée deux fois, aucun défaut, taille M, étiquette conservée.',
      brand: 'Stone Island',
      category: 'Jacket',
      size: 'M',
      condition: 'Neuf avec étiquette',
      price: 20,
      currency: 'EUR',
      seller: { rating: 5, reviews: 200, accountAge: 400, totalListings: 30, riskScore: null },
      ...overrides,
    },
    market: { estimatedValue: 100, comparableCount: 5, ...market },
    vision,
  };
}

function visionSignals(overrides: Partial<VisionSignals> = {}): VisionSignals {
  return {
    photoQualityScore: null,
    defects: [],
    extractedLabelText: [],
    brandLogoConsistent: null,
    counterfeitRiskFlags: [],
    ...overrides,
  };
}

describe('computeAnalysis', () => {
  it('recommends STRONG_BUY for a clearly great deal', () => {
    const result = computeAnalysis(baseInput());

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.recommendation).toBe('STRONG_BUY');
  });

  it('caps the score below GOOD_OPPORTUNITY/STRONG_BUY for a suspiciously-cheap price, even with a hot brand, mint condition, and trusted seller', () => {
    // Otherwise-perfect listing on every other axis (see baseInput), but priced at 10% of
    // estimated value — deep enough into the "suspiciously cheap" band to be a likely
    // fake/mistake, not just a great deal.
    const result = computeAnalysis(baseInput({ price: 10 }, { estimatedValue: 100 }));

    expect(result.score).toBeLessThanOrEqual(65);
    expect(result.recommendation).not.toBe('STRONG_BUY');
    expect(result.recommendation).not.toBe('GOOD_OPPORTUNITY');
    expect(result.explanation.some((line) => line.includes('anormalement bas'))).toBe(true);
  });

  it('does not cap the score for a merely notably-cheap (not suspicious) price', () => {
    // Ratio 0.2 is in the "notably cheap" band (0.15-0.3), below the "suspiciously cheap"
    // threshold (0.15) — a great deal, not a red flag.
    const result = computeAnalysis(baseInput({ price: 20 }, { estimatedValue: 100 }));

    expect(result.recommendation).toBe('STRONG_BUY');
  });

  it('recommends IGNORE for a clearly bad deal', () => {
    const result = computeAnalysis(
      baseInput(
        {
          brand: null,
          condition: 'Satisfaisant',
          price: 150,
          description: null,
          seller: null,
        },
        { estimatedValue: 100, comparableCount: 0 },
      ),
    );

    expect(result.score).toBeLessThan(50);
    expect(result.recommendation).toBe('IGNORE');
  });

  it('computes estimatedProfit and roi from market value vs price', () => {
    const result = computeAnalysis(baseInput({ price: 20 }, { estimatedValue: 100 }));

    expect(result.estimatedProfit).toBe(80);
    expect(result.roi).toBe(400); // (80/20)*100
  });

  it('computes a negative roi for an overpriced listing', () => {
    const result = computeAnalysis(baseInput({ price: 150 }, { estimatedValue: 100 }));

    expect(result.estimatedProfit).toBe(-50);
    expect(result.roi).toBeCloseTo(-33.33, 1);
  });

  it('includes a discount percentage line in the explanation', () => {
    const result = computeAnalysis(baseInput({ price: 20 }, { estimatedValue: 100 }));

    expect(result.explanation.some((line) => line.includes('80%') && line.includes('sous'))).toBe(
      true,
    );
  });

  it('flags a low-quality description in the explanation', () => {
    const result = computeAnalysis(baseInput({ description: 'Bon état' }));

    expect(result.explanation).toContain(
      'Description sous-optimisée — potentiel de sous-évaluation',
    );
  });

  it('flags an urgency signal in the explanation', () => {
    const result = computeAnalysis(
      baseInput({
        description: 'Vide dressing, doit partir vite, jamais porté, comme neuf avec étiquette.',
      }),
    );

    expect(result.explanation).toContain('Vendeur pressé — marge de négociation possible');
  });

  it('returns all five sub-scores within 0-100', () => {
    const result = computeAnalysis(baseInput());

    for (const value of [
      result.priceScore,
      result.brandScore,
      result.conditionScore,
      result.liquidityScore,
      result.authenticityScore,
    ]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('defaults vision fields to null/[] when no vision analysis was run (regression guard)', () => {
    const result = computeAnalysis(baseInput());

    expect(result.photoQualityScore).toBeNull();
    expect(result.defects).toEqual([]);
    expect(result.extractedLabelText).toEqual([]);
    expect(result.brandLogoConsistent).toBeNull();
    expect(result.counterfeitRiskFlags).toEqual([]);
  });

  it('caps the score below GOOD_OPPORTUNITY/STRONG_BUY when vision flags a brand/logo mismatch, even on an otherwise-perfect listing', () => {
    const result = computeAnalysis(
      baseInput({}, {}, visionSignals({ brandLogoConsistent: false })),
    );

    expect(result.score).toBeLessThanOrEqual(50);
    expect(result.recommendation).not.toBe('STRONG_BUY');
    expect(result.recommendation).not.toBe('GOOD_OPPORTUNITY');
    expect(result.explanation.some((line) => line.includes('contrefaçon'))).toBe(true);
  });

  it('caps the score when vision reports a counterfeit-risk flag', () => {
    const result = computeAnalysis(
      baseInput({}, {}, visionSignals({ counterfeitRiskFlags: ['Police du logo incorrecte'] })),
    );

    expect(result.score).toBeLessThanOrEqual(50);
  });

  it('applies the lower counterfeit cap (not just the suspiciously-cheap cap) when both signals fire', () => {
    const result = computeAnalysis(
      baseInput({ price: 10 }, { estimatedValue: 100 }, visionSignals({ brandLogoConsistent: false })),
    );

    expect(result.score).toBeLessThanOrEqual(50);
  });

  it('persists defects and extracted label text into the analysis result and explanation', () => {
    const result = computeAnalysis(
      baseInput(
        {},
        {},
        visionSignals({ defects: ['Légère usure au col'], extractedLabelText: ['REF 1234'] }),
      ),
    );

    expect(result.defects).toEqual(['Légère usure au col']);
    expect(result.extractedLabelText).toEqual(['REF 1234']);
    expect(result.explanation.some((line) => line.includes('Légère usure au col'))).toBe(true);
    expect(result.explanation.some((line) => line.includes('REF 1234'))).toBe(true);
  });

  it('does not cap or penalize when vision signals are all neutral (photos present but nothing flagged)', () => {
    const withVision = computeAnalysis(
      baseInput({}, {}, visionSignals({ photoQualityScore: 90, brandLogoConsistent: true })),
    );
    const withoutVision = computeAnalysis(baseInput());

    expect(withVision.recommendation).toBe('STRONG_BUY');
    expect(withVision.score).toBe(withoutVision.score);
  });
});
