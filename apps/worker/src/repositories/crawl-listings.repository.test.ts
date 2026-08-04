import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { CrawledListing } from '@vinted-hunter/crawler';
import type { PrismaClient } from '@vinted-hunter/database';
import { createTestPrismaClient } from '../test/test-prisma.js';
import { cleanDatabase } from '../test/db-cleanup.js';
import {
  createCrawlListingsRepository,
  type CrawlListingsRepository,
} from './crawl-listings.repository.js';

let prisma: PrismaClient;
let repository: CrawlListingsRepository;

beforeAll(() => {
  prisma = createTestPrismaClient();
  repository = createCrawlListingsRepository(prisma);
});

afterEach(async () => {
  await cleanDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

function crawledListing(overrides: Partial<CrawledListing> = {}): CrawledListing {
  return {
    externalId: 'vinted-1',
    source: 'VINTED',
    title: 'Nike Tech Fleece Hoodie',
    description: null,
    brand: 'Nike',
    category: 'Hoodie',
    size: 'L',
    condition: 'Very good',
    price: 35,
    currency: 'EUR',
    url: 'https://vinted.fr/items/1',
    images: ['https://images.vinted.net/1.jpg'],
    seller: { externalId: 'seller-1', username: 'seller1', rating: 4.8, reviews: 120 },
    publishedAt: '2024-01-01T00:00:00.000Z',
    contentHash: 'hash-1',
    ...overrides,
  };
}

describe('crawl-listings.repository', () => {
  describe('upsertListing', () => {
    it('creates a new listing and its seller', async () => {
      const result = await repository.upsertListing(crawledListing());

      expect(result.isNew).toBe(true);
      expect(result.priceChanged).toBe(false);
      expect(result.listing.title).toBe('Nike Tech Fleece Hoodie');

      const seller = await prisma.seller.findUnique({ where: { externalId: 'seller-1' } });
      expect(seller?.username).toBe('seller1');
    });

    it('is idempotent for the same externalId — updates instead of duplicating', async () => {
      await repository.upsertListing(crawledListing());
      const result = await repository.upsertListing(crawledListing({ title: 'Updated title' }));

      expect(result.isNew).toBe(false);
      expect(result.listing.title).toBe('Updated title');

      const count = await prisma.listing.count();
      expect(count).toBe(1);
    });

    it('records a PriceHistory row when the price changes on an existing listing', async () => {
      await repository.upsertListing(crawledListing({ price: 35 }));
      const result = await repository.upsertListing(crawledListing({ price: 30 }));

      expect(result.priceChanged).toBe(true);

      const history = await prisma.priceHistory.findMany({
        where: { listingId: result.listing.id },
      });
      expect(history).toHaveLength(1);
      expect(history[0]?.price).toBe(30);
    });

    it('does not record PriceHistory when the price is unchanged', async () => {
      await repository.upsertListing(crawledListing({ price: 35 }));
      const result = await repository.upsertListing(crawledListing({ price: 35 }));

      expect(result.priceChanged).toBe(false);
      const history = await prisma.priceHistory.findMany({
        where: { listingId: result.listing.id },
      });
      expect(history).toHaveLength(0);
    });

    it('handles a listing with no seller', async () => {
      const result = await repository.upsertListing(
        crawledListing({ seller: null, externalId: 'vinted-2' }),
      );

      expect(result.listing.sellerId).toBeNull();
    });

    it('records exactly one PriceHistory row when two concurrent upserts race on the same price change', async () => {
      // Simulates two Searches matching the same Vinted item and their crawl-search jobs
      // running concurrently (Worker concurrency = MAX_WORKERS) — without the Serializable
      // transaction, both could read the same stale price and both insert a PriceHistory row.
      await repository.upsertListing(crawledListing({ price: 35 }));

      const [first, second] = await Promise.all([
        repository.upsertListing(crawledListing({ price: 30 })),
        repository.upsertListing(crawledListing({ price: 30 })),
      ]);

      const history = await prisma.priceHistory.findMany({
        where: { listingId: first.listing.id },
      });
      expect(history).toHaveLength(1);
      expect([first.priceChanged, second.priceChanged].filter(Boolean)).toHaveLength(1);
    });
  });

  describe('findExistingExternalIds', () => {
    it('returns only the externalIds that exist', async () => {
      await repository.upsertListing(crawledListing({ externalId: 'vinted-1' }));

      const found = await repository.findExistingExternalIds(['vinted-1', 'vinted-missing']);

      expect(found).toEqual(new Set(['vinted-1']));
    });

    it('returns an empty set for an empty input without querying', async () => {
      const found = await repository.findExistingExternalIds([]);

      expect(found).toEqual(new Set());
    });
  });
});
