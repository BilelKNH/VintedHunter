import { describe, expect, it } from 'vitest';
import { buildOpportunityLines } from './build-lines.js';
import type { NotificationPayload } from '../types.js';

function payload(overrides: Partial<NotificationPayload> = {}): NotificationPayload {
  return {
    listingTitle: 'Nike Tech Fleece',
    listingUrl: 'https://vinted.fr/items/1',
    price: 29,
    currency: 'EUR',
    estimatedValue: 100,
    estimatedProfit: 60,
    score: 96,
    explanation: ['Prix très inférieur au marché', 'Taille recherchée', 'Vendeur fiable'],
    ...overrides,
  };
}

describe('buildOpportunityLines', () => {
  it('matches the §48 template shape', () => {
    const lines = buildOpportunityLines(payload());

    expect(lines).toEqual([
      '🔥 NOUVELLE OPPORTUNITÉ',
      'Nike Tech Fleece',
      'Prix : 29€',
      'Valeur : 100€',
      'Profit estimé : +60€',
      'Score : 96/100',
      'Analyse :',
      '- Prix très inférieur au marché',
      '- Taille recherchée',
      '- Vendeur fiable',
      'Lien : https://vinted.fr/items/1',
    ]);
  });

  it('formats non-EUR currencies with a code suffix instead of the € symbol', () => {
    const lines = buildOpportunityLines(payload({ currency: 'USD', price: 29 }));

    expect(lines).toContain('Prix : 29 USD');
  });

  it('handles an empty explanation list', () => {
    const lines = buildOpportunityLines(payload({ explanation: [] }));

    expect(lines).toContain('Analyse :');
    expect(lines).toContain('Lien : https://vinted.fr/items/1');
  });
});
