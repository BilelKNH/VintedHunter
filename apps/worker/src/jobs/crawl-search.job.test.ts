import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import type { PrismaClient, Search } from '@vinted-hunter/database';
import { createTestPrismaClient } from '../test/test-prisma.js';
import { cleanDatabase } from '../test/db-cleanup.js';
import { createCrawlListingsRepository } from '../repositories/crawl-listings.repository.js';
import type { CrawlCache } from '../cache/crawl-cache.js';
import {
  createCrawlSearchProcessor,
  type AnalyzeListingQueue,
  type VintedSearchClient,
} from './crawl-search.job.js';
import type { CrawlSearchJobData } from '../queue/queues.js';

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

function rawItem(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 111,
    title: 'Nike Tech Fleece Hoodie',
    url: 'https://www.vinted.fr/items/111',
    total_item_price: { amount: '35.00', currency_code: 'EUR' },
    brand_title: 'Nike',
    size_title: 'L',
    status: 'Very good',
    photos: [],
    user: null,
    created_at_ts: null,
    ...overrides,
  };
}

function fakeVintedClient(pages: unknown[][]): {
  client: VintedSearchClient;
  pagesRequested: number;
} {
  let pagesRequested = 0;
  const client: VintedSearchClient = {
    async *searchPages() {
      for (const page of pages) {
        pagesRequested += 1;
        yield page;
      }
    },
  };
  return {
    client,
    get pagesRequested() {
      return pagesRequested;
    },
  };
}

function fakeJob(data: CrawlSearchJobData): Job<CrawlSearchJobData> {
  return { data } as Job<CrawlSearchJobData>;
}

async function createSearch(
  overrides: Partial<{ enabled: boolean; maxPrice: number | null; brands: string[] }> = {},
): Promise<Search> {
  const user = await prisma.user.create({
    data: { email: `${Date.now()}-${Math.random()}@example.com`, password: 'hash' },
  });
  return prisma.search.create({
    data: {
      userId: user.id,
      name: 'Nike Tech Fleece L',
      brands: overrides.brands ?? ['Nike'],
      categories: [],
      sizes: [],
      keywords: [],
      excludedKeywords: [],
      maxPrice: overrides.maxPrice,
      frequency: 15,
      enabled: overrides.enabled ?? true,
    },
  });
}

describe('crawl-search job processor', () => {
  let cache: CrawlCache;
  let analyzeListingQueue: AnalyzeListingQueue;

  beforeEach(() => {
    cache = {
      shouldSkip: vi.fn().mockResolvedValue(false),
      markCrawled: vi.fn().mockResolvedValue(undefined),
    };
    analyzeListingQueue = { add: vi.fn().mockResolvedValue(undefined) };
  });

  it('persists matching listings, marks the search as crawled, and enqueues analysis for the new listing', async () => {
    const search = await createSearch();
    const { client } = fakeVintedClient([[rawItem()]]);
    const listingsRepository = createCrawlListingsRepository(prisma);
    const processor = createCrawlSearchProcessor({
      prisma,
      vintedClient: client,
      listingsRepository,
      cache,
      analyzeListingQueue,
    });

    const result = await processor(fakeJob({ searchId: search.id }));

    expect(result).toEqual({ collected: 1, new: 1 });
    const listing = await prisma.listing.findUnique({ where: { externalId: '111' } });
    expect(listing?.title).toBe('Nike Tech Fleece Hoodie');
    expect(cache.markCrawled).toHaveBeenCalledWith(search.id);
    expect(analyzeListingQueue.add).toHaveBeenCalledWith(
      'analyze-listing',
      expect.objectContaining({ listingId: listing?.id }),
    );
  });

  it('does not enqueue analysis for a listing that already existed', async () => {
    const search = await createSearch();
    const listingsRepository = createCrawlListingsRepository(prisma);
    await listingsRepository.upsertListing({
      externalId: '111',
      source: 'VINTED',
      title: 'Nike Tech Fleece Hoodie',
      description: null,
      brand: 'Nike',
      category: null,
      size: 'L',
      condition: null,
      price: 35,
      currency: 'EUR',
      url: 'https://www.vinted.fr/items/111',
      images: [],
      seller: null,
      publishedAt: null,
      contentHash: 'hash',
    });

    const { client } = fakeVintedClient([[rawItem()]]);
    const processor = createCrawlSearchProcessor({
      prisma,
      vintedClient: client,
      listingsRepository,
      cache,
      analyzeListingQueue,
    });

    await processor(fakeJob({ searchId: search.id }));

    expect(analyzeListingQueue.add).not.toHaveBeenCalled();
  });

  it("filters out listings that don't match the search criteria", async () => {
    const search = await createSearch({ maxPrice: 20 });
    const { client } = fakeVintedClient([[rawItem()]]); // price 35 > maxPrice 20
    const listingsRepository = createCrawlListingsRepository(prisma);
    const processor = createCrawlSearchProcessor({
      prisma,
      vintedClient: client,
      listingsRepository,
      cache,
      analyzeListingQueue,
    });

    const result = await processor(fakeJob({ searchId: search.id }));

    expect(result).toEqual({ collected: 0, new: 0 });
    expect(await prisma.listing.count()).toBe(0);
  });

  it('stops requesting further pages once a page has no new listings', async () => {
    const search = await createSearch();
    const listingsRepository = createCrawlListingsRepository(prisma);
    // Pre-seed the listing so page 1 is "all already known".
    await listingsRepository.upsertListing({
      externalId: '111',
      source: 'VINTED',
      title: 'Nike Tech Fleece Hoodie',
      description: null,
      brand: 'Nike',
      category: null,
      size: 'L',
      condition: null,
      price: 35,
      currency: 'EUR',
      url: 'https://www.vinted.fr/items/111',
      images: [],
      seller: null,
      publishedAt: null,
      contentHash: 'hash',
    });

    const tracked = fakeVintedClient([[rawItem()], [rawItem({ id: 222 })]]);
    const processor = createCrawlSearchProcessor({
      prisma,
      vintedClient: tracked.client,
      listingsRepository,
      cache,
      analyzeListingQueue,
    });

    await processor(fakeJob({ searchId: search.id }));

    expect(tracked.pagesRequested).toBe(1);
  });

  it('skips the search entirely when the cache guard says to (non-manual)', async () => {
    const search = await createSearch();
    cache.shouldSkip = vi.fn().mockResolvedValue(true);
    const { client, pagesRequested } = fakeVintedClient([[rawItem()]]);
    const listingsRepository = createCrawlListingsRepository(prisma);
    const processor = createCrawlSearchProcessor({
      prisma,
      vintedClient: client,
      listingsRepository,
      cache,
      analyzeListingQueue,
    });

    const result = await processor(fakeJob({ searchId: search.id }));

    expect(result).toEqual({ collected: 0, new: 0 });
    expect(pagesRequested).toBe(0);
  });

  it('bypasses the cache guard for a manual trigger', async () => {
    const search = await createSearch();
    cache.shouldSkip = vi.fn().mockResolvedValue(true);
    const { client } = fakeVintedClient([[rawItem()]]);
    const listingsRepository = createCrawlListingsRepository(prisma);
    const processor = createCrawlSearchProcessor({
      prisma,
      vintedClient: client,
      listingsRepository,
      cache,
      analyzeListingQueue,
    });

    const result = await processor(fakeJob({ searchId: search.id, manual: true }));

    expect(result).toEqual({ collected: 1, new: 1 });
  });

  it('does nothing for a disabled search', async () => {
    const search = await createSearch({ enabled: false });
    const { client, pagesRequested } = fakeVintedClient([[rawItem()]]);
    const listingsRepository = createCrawlListingsRepository(prisma);
    const processor = createCrawlSearchProcessor({
      prisma,
      vintedClient: client,
      listingsRepository,
      cache,
      analyzeListingQueue,
    });

    const result = await processor(fakeJob({ searchId: search.id }));

    expect(result).toEqual({ collected: 0, new: 0 });
    expect(pagesRequested).toBe(0);
    expect(cache.markCrawled).not.toHaveBeenCalled();
  });

  it("does nothing for a searchId that doesn't exist", async () => {
    const { client } = fakeVintedClient([[rawItem()]]);
    const listingsRepository = createCrawlListingsRepository(prisma);
    const processor = createCrawlSearchProcessor({
      prisma,
      vintedClient: client,
      listingsRepository,
      cache,
      analyzeListingQueue,
    });

    const result = await processor(fakeJob({ searchId: 'missing-search' }));

    expect(result).toEqual({ collected: 0, new: 0 });
  });
});
