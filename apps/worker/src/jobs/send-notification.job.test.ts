import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import type { HttpSender } from '@vinted-hunter/notifications';
import type { Analysis, Listing, PrismaClient } from '@vinted-hunter/database';
import { createTestPrismaClient } from '../test/test-prisma.js';
import { cleanDatabase } from '../test/db-cleanup.js';
import { createSendNotificationProcessor } from './send-notification.job.js';
import type { SendNotificationJobData } from '../queue/queues.js';

let prisma: PrismaClient;

beforeAll(() => {
  prisma = createTestPrismaClient();
});

afterEach(async () => {
  await cleanDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

function fakeJob(data: SendNotificationJobData): Job<SendNotificationJobData> {
  return { data } as Job<SendNotificationJobData>;
}

async function createListing(): Promise<Listing> {
  return prisma.listing.create({
    data: {
      externalId: `ext-${Date.now()}-${Math.random()}`,
      source: 'VINTED',
      title: 'Stone Island Shadow Project Jacket',
      price: 50,
      currency: 'EUR',
      url: 'https://vinted.fr/items/1',
      images: [],
    },
  });
}

async function createAnalysis(listingId: string): Promise<Analysis> {
  return prisma.analysis.create({
    data: {
      listingId,
      score: 95,
      priceScore: 100,
      brandScore: 95,
      conditionScore: 100,
      liquidityScore: 90,
      authenticityScore: 90,
      estimatedValue: 140,
      estimatedProfit: 90,
      roi: 180,
      maxBuyPrice: 107.69,
      explanation: ['Prix 64% sous la valeur marché estimée'],
    },
  });
}

describe('send-notification job processor', () => {
  it('sends to both channels when both are configured', async () => {
    const listing = await createListing();
    const analysis = await createAnalysis(listing.id);
    const post = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const http: HttpSender = { post };

    const processor = createSendNotificationProcessor({
      prisma,
      http,
      discordWebhookUrl: 'https://discord.example/webhook',
      telegramBotToken: 'TEST_TOKEN',
      telegramChatId: '12345',
    });

    const result = await processor(fakeJob({ analysisId: analysis.id }));

    expect(result).toEqual({ sent: true, discordSent: true, telegramSent: true });
    expect(post).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenCalledWith(
      'https://discord.example/webhook',
      expect.objectContaining({
        content: expect.stringContaining('Stone Island Shadow Project Jacket'),
      }),
    );
    expect(post).toHaveBeenCalledWith(
      'https://api.telegram.org/botTEST_TOKEN/sendMessage',
      expect.objectContaining({ chat_id: '12345' }),
    );
  });

  it('skips channels that are not configured', async () => {
    const listing = await createListing();
    const analysis = await createAnalysis(listing.id);
    const post = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const processor = createSendNotificationProcessor({
      prisma,
      http: { post },
      discordWebhookUrl: null,
      telegramBotToken: null,
      telegramChatId: null,
    });

    const result = await processor(fakeJob({ analysisId: analysis.id }));

    expect(result).toEqual({ sent: true, discordSent: null, telegramSent: null });
    expect(post).not.toHaveBeenCalled();
  });

  it('requires both telegramBotToken and telegramChatId to send via Telegram', async () => {
    const listing = await createListing();
    const analysis = await createAnalysis(listing.id);
    const post = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const processor = createSendNotificationProcessor({
      prisma,
      http: { post },
      discordWebhookUrl: null,
      telegramBotToken: 'TEST_TOKEN',
      telegramChatId: null,
    });

    const result = await processor(fakeJob({ analysisId: analysis.id }));

    expect(result.telegramSent).toBeNull();
    expect(post).not.toHaveBeenCalled();
  });

  it('does nothing for an analysisId that does not exist', async () => {
    const post = vi.fn();
    const processor = createSendNotificationProcessor({
      prisma,
      http: { post },
      discordWebhookUrl: 'https://discord.example/webhook',
      telegramBotToken: null,
      telegramChatId: null,
    });

    const result = await processor(fakeJob({ analysisId: 'missing-analysis' }));

    expect(result).toEqual({ sent: false, discordSent: null, telegramSent: null });
    expect(post).not.toHaveBeenCalled();
  });
});
