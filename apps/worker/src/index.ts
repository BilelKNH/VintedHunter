import { Worker } from 'bullmq';
import { createVintedClient, loadCrawlerConfig } from '@vinted-hunter/crawler';
import { prisma } from '@vinted-hunter/database';
import { loadEnv } from './config/env.js';
import { createRedisConnection } from './queue/connection.js';
import {
  CRAWL_SEARCH_QUEUE_NAME,
  createCrawlSearchQueue,
  type CrawlSearchJobData,
} from './queue/queues.js';
import { reconcileSchedule } from './queue/scheduler.js';
import { createCrawlCache } from './cache/crawl-cache.js';
import { createCrawlListingsRepository } from './repositories/crawl-listings.repository.js';
import { createCrawlSearchProcessor } from './jobs/crawl-search.job.js';
import { createPlaywrightSession } from './browser/playwright-session.js';

const RECONCILE_INTERVAL_MS = 60_000;

async function main(): Promise<void> {
  const env = loadEnv();
  const crawlerConfig = loadCrawlerConfig();

  const connection = createRedisConnection(env.REDIS_URL);
  const queue = createCrawlSearchQueue(connection);

  const session = await createPlaywrightSession(crawlerConfig.vintedBaseUrl);
  const vintedClient = createVintedClient({ http: session.context.request, config: crawlerConfig });

  const cache = createCrawlCache(connection, crawlerConfig.cacheDurationMs);
  const listingsRepository = createCrawlListingsRepository(prisma);
  const processor = createCrawlSearchProcessor({ prisma, vintedClient, listingsRepository, cache });

  const worker = new Worker<CrawlSearchJobData>(CRAWL_SEARCH_QUEUE_NAME, processor, {
    connection,
    concurrency: crawlerConfig.maxWorkers,
  });

  worker.on('completed', (job, result) => {
    console.log(`[worker] crawl-search ${job.id} (search ${job.data.searchId}) done`, result);
  });
  worker.on('failed', (job, error) => {
    console.error(`[worker] crawl-search ${job?.id ?? 'unknown'} failed`, error);
  });

  await reconcileSchedule(prisma, queue);
  const reconcileInterval = setInterval(() => {
    reconcileSchedule(prisma, queue).catch((error: unknown) => {
      console.error('[worker] schedule reconcile failed', error);
    });
  }, RECONCILE_INTERVAL_MS);

  let shuttingDown = false;
  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(reconcileInterval);
    await worker.close();
    await queue.close();
    await session.close();
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());

  console.log(`[worker] crawler online — concurrency=${crawlerConfig.maxWorkers}`);
}

main().catch((error: unknown) => {
  console.error('[worker] fatal startup error', error);
  process.exit(1);
});
