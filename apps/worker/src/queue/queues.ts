import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { ANALYZE_LISTING_QUEUE_NAME, type AnalyzeListingJobData } from '@vinted-hunter/shared';

export const CRAWL_SEARCH_QUEUE_NAME = 'crawl-search';
export const SEND_NOTIFICATION_QUEUE_NAME = 'send-notification';
export { ANALYZE_LISTING_QUEUE_NAME };

export interface CrawlSearchJobData {
  searchId: string;
  // Set by a manual/on-demand trigger (not used yet in Phase 4, but the job processor already
  // respects it) to bypass the CACHE_DURATION guard.
  manual?: boolean;
}

// send-notification is internal to this app (enqueued by analyze-listing.job.ts, consumed by
// this same worker) so its contract doesn't need to live in @vinted-hunter/shared like
// analyze-listing's does — apps/api never needs to know about it.
export interface SendNotificationJobData {
  analysisId: string;
}

export function createCrawlSearchQueue(connection: Redis): Queue<CrawlSearchJobData> {
  return new Queue<CrawlSearchJobData>(CRAWL_SEARCH_QUEUE_NAME, { connection });
}

export function createAnalyzeListingQueue(connection: Redis): Queue<AnalyzeListingJobData> {
  return new Queue<AnalyzeListingJobData>(ANALYZE_LISTING_QUEUE_NAME, { connection });
}

export function createSendNotificationQueue(connection: Redis): Queue<SendNotificationJobData> {
  return new Queue<SendNotificationJobData>(SEND_NOTIFICATION_QUEUE_NAME, { connection });
}
