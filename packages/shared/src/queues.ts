// Cross-app BullMQ contract for the analyze-listing queue: apps/api enqueues into it (see
// apps/api/src/queue/analysis-queue.ts), apps/worker consumes it (see
// apps/worker/src/jobs/analyze-listing.job.ts) — living here so neither app depends on the
// other just to agree on a queue name and job payload shape.
export const ANALYZE_LISTING_QUEUE_NAME = 'analyze-listing';

export interface AnalyzeListingJobData {
  listingId: string;
  manual?: boolean;
}
