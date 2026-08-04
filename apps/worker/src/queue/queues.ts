import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

export const CRAWL_SEARCH_QUEUE_NAME = 'crawl-search';

export interface CrawlSearchJobData {
  searchId: string;
  // Set by a manual/on-demand trigger (not used yet in Phase 4, but the job processor already
  // respects it) to bypass the CACHE_DURATION guard.
  manual?: boolean;
}

export function createCrawlSearchQueue(connection: Redis): Queue<CrawlSearchJobData> {
  return new Queue<CrawlSearchJobData>(CRAWL_SEARCH_QUEUE_NAME, { connection });
}
