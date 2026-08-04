import type { HttpSender, NotificationPayload } from './types.js';
import { formatDiscordMessage } from './formatting/discord-message.js';

export interface DiscordSenderDeps {
  http: HttpSender;
  webhookUrl: string;
}

export interface DiscordSender {
  send(payload: NotificationPayload): Promise<boolean>;
}

export function createDiscordSender({ http, webhookUrl }: DiscordSenderDeps): DiscordSender {
  return {
    async send(payload) {
      const response = await http.post(webhookUrl, {
        content: formatDiscordMessage(payload),
        // Listing titles are scraped verbatim from Vinted (attacker/seller-controlled) and
        // Discord parses @everyone/@here/role mentions in `content` by default — suppress all
        // mention parsing so a crafted title can't mass-ping the channel.
        allowed_mentions: { parse: [] },
      });
      return response.ok;
    },
  };
}
