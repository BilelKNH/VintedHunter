import { describe, expect, it, vi } from 'vitest';
import { createTelegramSender } from './telegram-sender.js';
import type { NotificationPayload } from './types.js';

const payload: NotificationPayload = {
  listingTitle: 'Nike Tech Fleece',
  listingUrl: 'https://vinted.fr/items/1',
  price: 29,
  currency: 'EUR',
  estimatedValue: 100,
  estimatedProfit: 60,
  score: 96,
  explanation: ['Prix très inférieur au marché'],
};

describe('createTelegramSender', () => {
  it('posts to the bot API sendMessage endpoint with the chat id and formatted text', async () => {
    const post = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const sender = createTelegramSender({
      http: { post },
      botToken: 'TEST_TOKEN',
      chatId: '12345',
    });

    const result = await sender.send(payload);

    expect(result).toBe(true);
    expect(post).toHaveBeenCalledWith(
      'https://api.telegram.org/botTEST_TOKEN/sendMessage',
      expect.objectContaining({
        chat_id: '12345',
        text: expect.stringContaining('Nike Tech Fleece'),
      }),
    );
  });

  it('returns false when the request fails', async () => {
    const post = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    const sender = createTelegramSender({
      http: { post },
      botToken: 'TEST_TOKEN',
      chatId: '12345',
    });

    await expect(sender.send(payload)).resolves.toBe(false);
  });
});
