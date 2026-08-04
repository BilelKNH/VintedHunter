import type { PrismaClient } from '@vinted-hunter/database';
import { priorityForBrands } from '@vinted-hunter/crawler';
import { CRAWL_SEARCH_QUEUE_NAME, type CrawlSearchJobData } from './queues.js';

const MINUTE_MS = 60_000;
const RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 5000;

export interface RepeatableJobInfo {
  key: string;
  id?: string | null;
  every?: string | null;
}

// Narrow slice of BullMQ's Queue API — real Queue instances satisfy this structurally, and
// tests can pass a lightweight fake without spinning up Redis.
export interface SchedulerQueue {
  getRepeatableJobs(): Promise<RepeatableJobInfo[]>;
  add(
    name: string,
    data: CrawlSearchJobData,
    opts: {
      jobId: string;
      repeat: { every: number };
      priority: number;
      attempts: number;
      backoff: { type: 'exponential'; delay: number };
    },
  ): Promise<unknown>;
  removeRepeatableByKey(key: string): Promise<unknown>;
}

function jobIdForSearch(searchId: string): string {
  return `search:${searchId}`;
}

// Reconciles BullMQ's repeatable jobs against the current set of enabled Searches (§11.4,
// §11.6): adds jobs for newly enabled searches, updates the schedule when frequency changed,
// and removes jobs for searches that are now disabled or deleted. Safe to call repeatedly —
// searches whose schedule is already correct are left untouched so their next-run time isn't
// reset on every reconcile tick.
//
// Known limitation: BullMQ's getRepeatableJobs() doesn't expose the `priority` a repeatable
// job was scheduled with, only `every`/pattern — so a search whose `brands` changed (affecting
// priorityForBrands) without its `frequency` changing keeps its stale queued priority until
// something else forces a re-add (e.g. a later frequency edit). Not fixed here: forcing an
// unconditional re-add on every tick to pick up priority changes risks resetting BullMQ's
// next-run scheduling in ways not verified against this repo's installed bullmq version — the
// safer fix (persisting last-applied priority, e.g. in Redis alongside the crawl cache) is a
// deliberate follow-up rather than a same-pass change.
export async function reconcileSchedule(
  prisma: PrismaClient,
  queue: SchedulerQueue,
): Promise<void> {
  const enabledSearches = await prisma.search.findMany({ where: { enabled: true } });
  const existingRepeatable = await queue.getRepeatableJobs();
  const existingByJobId = new Map(existingRepeatable.map((job) => [job.id, job]));
  const desiredJobIds = new Set(enabledSearches.map((search) => jobIdForSearch(search.id)));

  for (const search of enabledSearches) {
    const jobId = jobIdForSearch(search.id);
    const every = search.frequency * MINUTE_MS;
    const existing = existingByJobId.get(jobId);

    if (existing && existing.every === String(every)) {
      continue;
    }

    if (existing) {
      await queue.removeRepeatableByKey(existing.key);
    }

    await queue.add(
      CRAWL_SEARCH_QUEUE_NAME,
      { searchId: search.id },
      {
        jobId,
        repeat: { every },
        priority: priorityForBrands(search.brands),
        attempts: RETRY_ATTEMPTS,
        backoff: { type: 'exponential', delay: RETRY_BACKOFF_MS },
      },
    );
  }

  for (const job of existingRepeatable) {
    if (job.id && !desiredJobIds.has(job.id)) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
