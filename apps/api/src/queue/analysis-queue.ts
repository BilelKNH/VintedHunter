import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { ANALYZE_LISTING_QUEUE_NAME, type AnalyzeListingJobData } from '@vinted-hunter/shared';

// apps/api only ever produces into this queue (POST /analysis/:id) — apps/worker owns the
// consumer/processor (see apps/worker/src/jobs/analyze-listing.job.ts). The queue name/job
// data contract lives in @vinted-hunter/shared so neither app depends on the other.
export function createAnalysisQueue(connection: Redis): Queue<AnalyzeListingJobData> {
  return new Queue<AnalyzeListingJobData>(ANALYZE_LISTING_QUEUE_NAME, { connection });
}
