import type { HttpSender, NotificationPayload } from './types.js';
import { formatTelegramMessage } from './formatting/telegram-message.js';

export interface TelegramSenderDeps {
  http: HttpSender;
  botToken: string;
  chatId: string;
}

export interface TelegramSender {
  send(payload: NotificationPayload): Promise<boolean>;
}

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export function createTelegramSender({
  http,
  botToken,
  chatId,
}: TelegramSenderDeps): TelegramSender {
  return {
    async send(payload) {
      const url = `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`;
      const response = await http.post(url, {
        chat_id: chatId,
        text: formatTelegramMessage(payload),
      });
      return response.ok;
    },
  };
}
