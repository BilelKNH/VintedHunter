import type { PrismaClient } from '@vinted-hunter/database';
import { priorityForBrands } from '@vinted-hunter/crawler';
import { CRAWL_SEARCH_QUEUE_NAME, type CrawlSearchJobData } from './queues.js';

const MINUTE_MS = 60_000;
const RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 5000;

export interface JobSchedulerInfo {
  key: string;
}

// Narrow slice of BullMQ's modern Job Scheduler API — real Queue instances satisfy this
// structurally, tests can pass a lightweight fake without spinning up Redis.
//
// Deliberately NOT the legacy repeatable-jobs API (add() with a `repeat` option, paired with
// getRepeatableJobs()/removeRepeatableByKey()): verified directly against this repo's installed
// bullmq version (5.81.3) that its repeatable-job listing never populates `.id` with the custom
// jobId passed at creation — job-scheduler.js's transformSchedulerData only sets `.id` via a
// legacy fallback branch that doesn't fire for jobs created through the current API. Matching
// listed jobs back to searches by `.id` silently always failed, so orphaned schedules for
// deleted searches never got cleaned up (found and worked around by hand in Redis once already).
// The Job Scheduler API's `.key` is the jobSchedulerId itself, unhashed — confirmed empirically
// against a live queue — so matching by key is reliable.
export interface SchedulerQueue {
  getJobSchedulers(): Promise<JobSchedulerInfo[]>;
  upsertJobScheduler(
    jobSchedulerId: string,
    repeatOpts: { every: number },
    jobTemplate: {
      name: string;
      data: CrawlSearchJobData;
      opts: {
        priority: number;
        attempts: number;
        backoff: { type: 'exponential'; delay: number };
      };
    },
  ): Promise<unknown>;
  removeJobScheduler(jobSchedulerId: string): Promise<unknown>;
}

function jobIdForSearch(searchId: string): string {
  return `search:${searchId}`;
}

// Reconciles BullMQ's job schedulers against the current set of enabled Searches (§11.4, §11.6):
// upserts one per enabled search, removes any scheduler that no longer corresponds to one.
// upsertJobScheduler is idempotent — confirmed empirically that calling it repeatedly with
// unchanged options is a no-op that doesn't shift the next-run time — so unlike the old repeat
// API there's no need to compare against the existing schedule before deciding whether to touch
// it. That also means a search's priority now stays in sync on every tick instead of only when
// frequency changes (the old code's documented "known limitation", fixed as a side effect).
export async function reconcileSchedule(
  prisma: PrismaClient,
  queue: SchedulerQueue,
): Promise<void> {
  const enabledSearches = await prisma.search.findMany({ where: { enabled: true } });
  const desiredJobIds = new Set(enabledSearches.map((search) => jobIdForSearch(search.id)));

  for (const search of enabledSearches) {
    await queue.upsertJobScheduler(
      jobIdForSearch(search.id),
      { every: search.frequency * MINUTE_MS },
      {
        name: CRAWL_SEARCH_QUEUE_NAME,
        data: { searchId: search.id },
        opts: {
          priority: priorityForBrands(search.brands),
          attempts: RETRY_ATTEMPTS,
          backoff: { type: 'exponential', delay: RETRY_BACKOFF_MS },
        },
      },
    );
  }

  const existingSchedulers = await queue.getJobSchedulers();
  for (const scheduler of existingSchedulers) {
    if (!desiredJobIds.has(scheduler.key)) {
      await queue.removeJobScheduler(scheduler.key);
    }
  }
}
