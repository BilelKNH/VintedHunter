import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@vinted-hunter/database';
import { CRAWL_PRIORITY } from '@vinted-hunter/crawler';
import { createTestPrismaClient } from '../test/test-prisma.js';
import { cleanDatabase } from '../test/db-cleanup.js';
import { reconcileSchedule, type RepeatableJobInfo, type SchedulerQueue } from './scheduler.js';

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

function fakeQueue(repeatableJobs: RepeatableJobInfo[] = []): SchedulerQueue {
  return {
    getRepeatableJobs: vi.fn().mockResolvedValue(repeatableJobs),
    add: vi.fn().mockResolvedValue(undefined),
    removeRepeatableByKey: vi.fn().mockResolvedValue(undefined),
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
  it('adds a repeatable job for a newly enabled search with the correct priority', async () => {
    const search = await createSearch({ brands: ['Nike Tech Fleece'], frequency: 15 });
    const queue = fakeQueue([]);

    await reconcileSchedule(prisma, queue);

    expect(queue.add).toHaveBeenCalledWith(
      'crawl-search',
      { searchId: search.id },
      expect.objectContaining({
        jobId: `search:${search.id}`,
        repeat: { every: 15 * 60_000 },
        priority: CRAWL_PRIORITY.HIGH,
      }),
    );
  });

  it('does not re-add a search whose schedule is already correct', async () => {
    const search = await createSearch({ frequency: 30 });
    const queue = fakeQueue([{ key: 'k1', id: `search:${search.id}`, every: String(30 * 60_000) }]);

    await reconcileSchedule(prisma, queue);

    expect(queue.add).not.toHaveBeenCalled();
    expect(queue.removeRepeatableByKey).not.toHaveBeenCalled();
  });

  it('replaces the schedule when frequency changed', async () => {
    const search = await createSearch({ frequency: 60 });
    const queue = fakeQueue([
      { key: 'old-key', id: `search:${search.id}`, every: String(15 * 60_000) },
    ]);

    await reconcileSchedule(prisma, queue);

    expect(queue.removeRepeatableByKey).toHaveBeenCalledWith('old-key');
    expect(queue.add).toHaveBeenCalledWith(
      'crawl-search',
      { searchId: search.id },
      expect.objectContaining({ repeat: { every: 60 * 60_000 } }),
    );
  });

  it('removes repeatable jobs for searches that are no longer enabled', async () => {
    const queue = fakeQueue([{ key: 'stale-key', id: 'search:deleted-search', every: '900000' }]);

    await reconcileSchedule(prisma, queue);

    expect(queue.removeRepeatableByKey).toHaveBeenCalledWith('stale-key');
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('does not schedule a disabled search', async () => {
    await createSearch({ enabled: false });
    const queue = fakeQueue([]);

    await reconcileSchedule(prisma, queue);

    expect(queue.add).not.toHaveBeenCalled();
  });
});
