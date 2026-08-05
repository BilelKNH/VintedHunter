import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@vinted-hunter/database';
import { CRAWL_PRIORITY } from '@vinted-hunter/crawler';
import { createTestPrismaClient } from '../test/test-prisma.js';
import { cleanDatabase } from '../test/db-cleanup.js';
import { reconcileSchedule, type JobSchedulerInfo, type SchedulerQueue } from './scheduler.js';

let prisma: PrismaClient;

beforeAll(() => {
  prisma = createTestPrismaClient();
});

afterEach(async () => {
  await cleanDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

function fakeQueue(jobSchedulers: JobSchedulerInfo[] = []): SchedulerQueue {
  return {
    getJobSchedulers: vi.fn().mockResolvedValue(jobSchedulers),
    upsertJobScheduler: vi.fn().mockResolvedValue(undefined),
    removeJobScheduler: vi.fn().mockResolvedValue(undefined),
  };
}

async function createSearch(
  overrides: Partial<{
    name: string;
    brands: string[];
    frequency: number;
    enabled: boolean;
  }> = {},
) {
  const user = await prisma.user.create({
    data: { email: `${Date.now()}-${Math.random()}@example.com`, password: 'hash' },
  });
  return prisma.search.create({
    data: {
      userId: user.id,
      name: overrides.name ?? 'Nike Tech Fleece L',
      brands: overrides.brands ?? ['Nike Tech Fleece'],
      categories: [],
      sizes: [],
      keywords: [],
      excludedKeywords: [],
      frequency: overrides.frequency ?? 15,
      enabled: overrides.enabled ?? true,
    },
  });
}

describe('reconcileSchedule', () => {
  it('upserts a job scheduler for an enabled search with the correct priority', async () => {
    const search = await createSearch({ brands: ['Nike Tech Fleece'], frequency: 15 });
    const queue = fakeQueue([]);

    await reconcileSchedule(prisma, queue);

    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      `search:${search.id}`,
      { every: 15 * 60_000 },
      expect.objectContaining({
        name: 'crawl-search',
        data: { searchId: search.id },
        opts: expect.objectContaining({ priority: CRAWL_PRIORITY.HIGH }),
      }),
    );
  });

  it('upserts unconditionally even when a scheduler already exists for the search (idempotent by design)', async () => {
    const search = await createSearch({ frequency: 30 });
    const queue = fakeQueue([{ key: `search:${search.id}` }]);

    await reconcileSchedule(prisma, queue);

    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      `search:${search.id}`,
      { every: 30 * 60_000 },
      expect.anything(),
    );
    expect(queue.removeJobScheduler).not.toHaveBeenCalled();
  });

  it('removes job schedulers for searches that are no longer enabled', async () => {
    const queue = fakeQueue([{ key: 'search:deleted-search' }]);

    await reconcileSchedule(prisma, queue);

    expect(queue.removeJobScheduler).toHaveBeenCalledWith('search:deleted-search');
    expect(queue.upsertJobScheduler).not.toHaveBeenCalled();
  });

  it('does not upsert or remove anything for a disabled search with no existing scheduler', async () => {
    await createSearch({ enabled: false });
    const queue = fakeQueue([]);

    await reconcileSchedule(prisma, queue);

    expect(queue.upsertJobScheduler).not.toHaveBeenCalled();
    expect(queue.removeJobScheduler).not.toHaveBeenCalled();
  });

  it('leaves an enabled search alone while removing an unrelated orphaned scheduler in the same pass', async () => {
    const search = await createSearch({ frequency: 60 });
    const queue = fakeQueue([
      { key: `search:${search.id}` },
      { key: 'search:some-other-deleted-search' },
    ]);

    await reconcileSchedule(prisma, queue);

    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      `search:${search.id}`,
      { every: 60 * 60_000 },
      expect.anything(),
    );
    expect(queue.removeJobScheduler).toHaveBeenCalledWith('search:some-other-deleted-search');
    expect(queue.removeJobScheduler).toHaveBeenCalledTimes(1);
  });
});
