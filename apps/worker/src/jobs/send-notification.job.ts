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
  discordWebhookUrl: string | null;
  telegramBotToken: string | null;
  telegramChatId: string | null;
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
    const { analysisId } = job.data;

    const analysis = await deps.prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { listing: true },
    });
    if (!analysis) {
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

    const discordSent = deps.discordWebhookUrl
      ? await createDiscordSender({ http: deps.http, webhookUrl: deps.discordWebhookUrl }).send(
          payload,
        )
      : null;

    const telegramSent =
      deps.telegramBotToken && deps.telegramChatId
        ? await createTelegramSender({
            http: deps.http,
            botToken: deps.telegramBotToken,
            chatId: deps.telegramChatId,
          }).send(payload)
        : null;

    return { sent: true, discordSent, telegramSent };
  };
}
