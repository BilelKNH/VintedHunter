import type { NotificationPayload } from '../types.js';
import { buildOpportunityLines } from './build-lines.js';

export function formatDiscordMessage(payload: NotificationPayload): string {
  return buildOpportunityLines(payload).join('\n');
}
