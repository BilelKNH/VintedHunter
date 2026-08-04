import { describe, expect, it } from 'vitest';
import { detectSellerKeywords } from './seller-keywords.js';

describe('detectSellerKeywords', () => {
  it('detects an urgency keyword in the title', () => {
    const result = detectSellerKeywords('Vente urgente Nike Tech Fleece', null);

    expect(result.hasUrgencySignal).toBe(true);
    expect(result.matchedKeywords).toContain('urgent');
  });

  it('detects an urgency keyword in the description', () => {
    const result = detectSellerKeywords('Nike Tech Fleece', 'Vide dressing, tout doit partir');

    expect(result.hasUrgencySignal).toBe(true);
    expect(result.matchedKeywords).toEqual(
      expect.arrayContaining(['vide dressing', 'doit partir']),
    );
  });

  it('is case-insensitive', () => {
    const result = detectSellerKeywords('URGENT Nike Hoodie', null);

    expect(result.hasUrgencySignal).toBe(true);
  });

  it('returns no signal when nothing matches', () => {
    const result = detectSellerKeywords('Nike Tech Fleece Hoodie', 'Excellent état, peu porté');

    expect(result.hasUrgencySignal).toBe(false);
    expect(result.matchedKeywords).toEqual([]);
  });

  it('handles a null description', () => {
    const result = detectSellerKeywords('Nike Hoodie', null);

    expect(result.hasUrgencySignal).toBe(false);
  });
});
