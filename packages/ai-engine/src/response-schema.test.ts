import { describe, expect, it } from 'vitest';
import { visionAnalysisResultSchema } from './response-schema.js';

describe('visionAnalysisResultSchema', () => {
  it('accepts a well-formed vision analysis result', () => {
    const result = visionAnalysisResultSchema.parse({
      photoQualityScore: 80,
      defects: ['Légère usure au col'],
      extractedLabelText: ['REF 1234', 'Taille M'],
      brandLogoConsistent: true,
      counterfeitRiskFlags: [],
    });

    expect(result.photoQualityScore).toBe(80);
    expect(result.brandLogoConsistent).toBe(true);
  });

  it('accepts brandLogoConsistent: null (logo not visible / brand unknown)', () => {
    const result = visionAnalysisResultSchema.parse({
      photoQualityScore: 50,
      defects: [],
      extractedLabelText: [],
      brandLogoConsistent: null,
      counterfeitRiskFlags: [],
    });

    expect(result.brandLogoConsistent).toBeNull();
  });

  it('rejects a photoQualityScore outside 0-100', () => {
    expect(() =>
      visionAnalysisResultSchema.parse({
        photoQualityScore: 150,
        defects: [],
        extractedLabelText: [],
        brandLogoConsistent: null,
        counterfeitRiskFlags: [],
      }),
    ).toThrow();
  });

  it('rejects a missing required field', () => {
    expect(() =>
      visionAnalysisResultSchema.parse({
        photoQualityScore: 50,
        defects: [],
        extractedLabelText: [],
        counterfeitRiskFlags: [],
      }),
    ).toThrow();
  });
});
