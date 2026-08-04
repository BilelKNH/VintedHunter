import type { NotificationPayload } from '../types.js';

function formatAmount(amount: number, currency: string): string {
  return currency.toUpperCase() === 'EUR' ? `${amount}€` : `${amount} ${currency}`;
}

// §48's exact alert template — shared between Discord and Telegram since both send plain text
// (see formatting/telegram-message.ts for why Telegram doesn't use MarkdownV2 here).
export function buildOpportunityLines(payload: NotificationPayload): string[] {
  return [
    '🔥 NOUVELLE OPPORTUNITÉ',
    payload.listingTitle,
    `Prix : ${formatAmount(payload.price, payload.currency)}`,
    `Valeur : ${formatAmount(payload.estimatedValue, payload.currency)}`,
    `Profit estimé : +${formatAmount(payload.estimatedProfit, payload.currency)}`,
    `Score : ${payload.score}/100`,
    'Analyse :',
    ...payload.explanation.map((line) => `- ${line}`),
    `Lien : ${payload.listingUrl}`,
  ];
}
