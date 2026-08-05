import { Worker } from 'bullmq';
import { ANALYZE_LISTING_QUEUE_NAME, type AnalyzeListingJobData } from '@vinted-hunter/shared';
import { createVintedClient, loadCrawlerConfig } from '@vinted-hunter/crawler';
import { prisma } from '@vinted-hunter/database';
import { createVisionAnalyzer, type VisionAnalyzer } from '@vinted-hunter/ai-engine';
import { loadEnv } from './config/env.js';
import { createRedisConnection } from './queue/connection.js';
import {
  CRAWL_SEARCH_QUEUE_NAME,
  SEND_NOTIFICATION_QUEUE_NAME,
  createAnalyzeListingQueue,
  createCrawlSearchQueue,
  createSendNotificationQueue,
  type CrawlSearchJobData,
  type SendNotificationJobData,
} from './queue/queues.js';
import { reconcileSchedule } from './queue/scheduler.js';
import { createCrawlCache } from './cache/crawl-cache.js';
import { createCrawlListingsRepository } from './repositories/crawl-listings.repository.js';
import { createComparableListingsRepository } from './repositories/comparable-listings.repository.js';
import { createAnalysisRepository } from './repositories/analysis.repository.js';
import { createCrawlSearchProcessor } from './jobs/crawl-search.job.js';
import { createAnalyzeListingProcessor } from './jobs/analyze-listing.job.js';
import { createSendNotificationProcessor } from './jobs/send-notification.job.js';
import { createPlaywrightSession } from './browser/playwright-session.js';
import { createPageFetchClient } from './browser/page-fetch-client.js';
import { fetchHttpSender } from './notifications/fetch-http-sender.js';

const RECONCILE_INTERVAL_MS = 60_000;

async function main(): Promise<void> {
  const env = loadEnv();
  const crawlerConfig = loadCrawlerConfig();

  const connection = createRedisConnection(env.REDIS_URL);
  const crawlSearchQueue = createCrawlSearchQueue(connection);
  const analyzeListingQueue = createAnalyzeListingQueue(connection);
  const sendNotificationQueue = createSendNotificationQueue(connection);

  const session = await createPlaywrightSession(crawlerConfig.vintedBaseUrl);
  const vintedClient = createVintedClient({
    http: createPageFetchClient(session.page),
    config: crawlerConfig,
  });

  const cache = createCrawlCache(connection, crawlerConfig.cacheDurationMs);
  const crawlListingsRepository = createCrawlListingsRepository(prisma);
  const comparableListingsRepository = createComparableListingsRepository(prisma);
  const analysisRepository = createAnalysisRepository(prisma);

  const visionAnalyzer: VisionAnalyzer | null = env.ANTHROPIC_API_KEY
    ? createVisionAnalyzer({ apiKey: env.ANTHROPIC_API_KEY, model: env.VISION_MODEL })
    : null;

  const crawlSearchProcessor = createCrawlSearchProcessor({
    prisma,
    vintedClient,
    listingsRepository: crawlListingsRepository,
    cache,
    analyzeListingQueue,
  });
  const analyzeListingProcessor = createAnalyzeListingProcessor({
    prisma,
    comparableListingsRepository,
    analysisRepository,
    notificationQueue: sendNotificationQueue,
    visionAnalyzer,
  });
  const sendNotificationProcessor = createSendNotificationProcessor({
    prisma,
    http: fetchHttpSender,
    discordWebhookUrl: env.DISCORD_WEBHOOK || null,
    telegramBotToken: env.TELEGRAM_TOKEN || null,
    telegramChatId: env.TELEGRAM_CHAT_ID || null,
  });

  const crawlSearchWorker = new Worker<CrawlSearchJobData>(
    CRAWL_SEARCH_QUEUE_NAME,
    crawlSearchProcessor,
    {
      connection,
      concurrency: crawlerConfig.maxWorkers,
    },
  );
  const analyzeListingWorker = new Worker<AnalyzeListingJobData>(
    ANALYZE_LISTING_QUEUE_NAME,
    analyzeListingProcessor,
    { connection, concurrency: crawlerConfig.maxWorkers },
  );
  const sendNotificationWorker = new Worker<SendNotificationJobData>(
    SEND_NOTIFICATION_QUEUE_NAME,
    sendNotificationProcessor,
    { connection },
  );

  const workers = [crawlSearchWorker, analyzeListingWorker, sendNotificationWorker];
  for (const worker of workers) {
    worker.on('completed', (job, result) => {
      console.log(`[worker] ${job.queueName} ${job.id} done`, result);
    });
    worker.on('failed', (job, error) => {
      console.error(
        `[worker] ${job?.queueName ?? 'unknown'} ${job?.id ?? 'unknown'} failed`,
        error,
      );
    });
  }

  await reconcileSchedule(prisma, crawlSearchQueue);
  const reconcileInterval = setInterval(() => {
    reconcileSchedule(prisma, crawlSearchQueue).catch((error: unknown) => {
      console.error('[worker] schedule reconcile failed', error);
    });
  }, RECONCILE_INTERVAL_MS);

  let shuttingDown = false;
  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(reconcileInterval);
    await Promise.all(workers.map((worker) => worker.close()));
    await Promise.all(
      [crawlSearchQueue, analyzeListingQueue, sendNotificationQueue].map((queue) => queue.close()),
    );
    await session.close();
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());

  console.log(
    `[worker] crawler+intelligence online — concurrency=${crawlerConfig.maxWorkers}, vision=${visionAnalyzer ? env.VISION_MODEL : 'disabled'}`,
  );
}

main().catch((error: unknown) => {
  console.error('[worker] fatal startup error', error);
  process.exit(1);
});
