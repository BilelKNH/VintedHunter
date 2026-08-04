import type { NotificationPayload } from '../types.js';
import { buildOpportunityLines } from './build-lines.js';

// Plain text, not MarkdownV2 — escaping arbitrary listing titles/URLs for Telegram's MarkdownV2
// parser is finicky (every `.`, `-`, `(`, etc. needs escaping) and not worth it for V1 when
// plain text renders the same content just as readably.
export function formatTelegramMessage(payload: NotificationPayload): string {
  return buildOpportunityLines(payload).join('\n');
}
