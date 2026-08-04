import { describe, expect, it } from 'vitest';
import { detectTitleErrors } from './error-detection.js';

describe('detectTitleErrors', () => {
  it('suggests a correction for a likely brand typo', () => {
    const result = detectTitleErrors('Nik hoodie noir L', null);

    expect(result.suggestedBrandCorrection).toBe('nike');
  });

  it('does not run when a brand is already known', () => {
    const result = detectTitleErrors('Nik hoodie noir L', 'Nike');

    expect(result.suggestedBrandCorrection).toBeNull();
  });

  it('returns null when the title already contains the exact brand name', () => {
    const result = detectTitleErrors('Nike hoodie noir L', null);

    expect(result.suggestedBrandCorrection).toBeNull();
  });

  it('returns null when nothing is close enough to a known brand', () => {
    const result = detectTitleErrors('Pull en laine noir taille L', null);

    expect(result.suggestedBrandCorrection).toBeNull();
  });

  it('ignores short words that are too generic to fuzzy-match safely', () => {
    const result = detectTitleErrors('Un pull noir taille L', null);

    expect(result.suggestedBrandCorrection).toBeNull();
  });
});
