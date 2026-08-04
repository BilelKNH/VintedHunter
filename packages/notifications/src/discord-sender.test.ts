import { describe, expect, it, vi } from 'vitest';
import { createDiscordSender } from './discord-sender.js';
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

describe('createDiscordSender', () => {
  it('posts a formatted message to the webhook URL', async () => {
    const post = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    const sender = createDiscordSender({
      http: { post },
      webhookUrl: 'https://discord.example/webhook',
    });

    const result = await sender.send(payload);

    expect(result).toBe(true);
    expect(post).toHaveBeenCalledWith(
      'https://discord.example/webhook',
      expect.objectContaining({ content: expect.stringContaining('Nike Tech Fleece') }),
    );
  });

  it('suppresses mention parsing so a crafted listing title cannot mass-ping the channel', async () => {
    const post = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    const sender = createDiscordSender({
      http: { post },
      webhookUrl: 'https://discord.example/webhook',
    });

    await sender.send({ ...payload, listingTitle: '@everyone free stuff' });

    expect(post).toHaveBeenCalledWith(
      'https://discord.example/webhook',
      expect.objectContaining({ allowed_mentions: { parse: [] } }),
    );
  });

  it('returns false when the webhook request fails', async () => {
    const post = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const sender = createDiscordSender({
      http: { post },
      webhookUrl: 'https://discord.example/webhook',
    });

    await expect(sender.send(payload)).resolves.toBe(false);
  });
});
