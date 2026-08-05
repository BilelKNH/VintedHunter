import type { Job } from 'bullmq';
import type { PrismaClient } from '@vinted-hunter/database';
import {
  createDiscordSender,
  createTelegramSender,
  type HttpSender,
  type NotificationPayload,
} from '@vinted-hunter/notifications';
import type { SendNotificationJobData } from '../queue/queues.js';

export interface SendNotificationJobDeps {
  prisma: PrismaClient;
  http: HttpSender;
}

export interface SendNotificationJobResult {
  sent: boolean;
  discordSent: boolean | null; // null = channel not configured, skipped
  telegramSent: boolean | null;
}

export function createSendNotificationProcessor(deps: SendNotificationJobDeps) {
  return async function processSendNotificationJob(
    job: Job<SendNotificationJobData>,
  ): Promise<SendNotificationJobResult> {
    const { analysisId, userId } = job.data;

    const analysis = await deps.prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { listing: true },
    });
    if (!analysis || !userId) {
      return { sent: false, discordSent: null, telegramSent: null };
    }

    // Per-user destinations (replaces the old global DISCORD_WEBHOOK/TELEGRAM_TOKEN/
    // TELEGRAM_CHAT_ID env vars) — the search owner's own settings, not one shared channel
    // for every user of this instance.
    const user = await deps.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { sent: false, discordSent: null, telegramSent: null };
    }

    const payload: NotificationPayload = {
      listingTitle: analysis.listing.title,
      listingUrl: analysis.listing.url,
      price: analysis.listing.price,
      currency: analysis.listing.currency,
      estimatedValue: analysis.estimatedValue,
      estimatedProfit: analysis.estimatedProfit,
      score: analysis.score,
      explanation: Array.isArray(analysis.explanation) ? (analysis.explanation as string[]) : [],
    };

    const discordSent = user.discordWebhook
      ? await createDiscordSender({ http: deps.http, webhookUrl: user.discordWebhook }).send(
          payload,
        )
      : null;

    const telegramSent =
      user.telegramBotToken && user.telegramChatId
        ? await createTelegramSender({
            http: deps.http,
            botToken: user.telegramBotToken,
            chatId: user.telegramChatId,
          }).send(payload)
        : null;

    return { sent: true, discordSent, telegramSent };
  };
}
