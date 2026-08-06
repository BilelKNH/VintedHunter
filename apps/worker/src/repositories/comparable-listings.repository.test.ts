import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Listing, PrismaClient } from '@vinted-hunter/database';
import { createTestPrismaClient } from '../test/test-prisma.js';
import { cleanDatabase } from '../test/db-cleanup.js';
import {
  createComparableListingsRepository,
  type ComparableListingsRepository,
} from './comparable-listings.repository.js';

let prisma: PrismaClient;
let repository: ComparableListingsRepository;

beforeAll(() => {
  prisma = createTestPrismaClient();
  repository = createComparableListingsRepository(prisma);
});

afterEach(async () => {
  await cleanDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createListing(
  overrides: Partial<{
    externalId: string;
    brand: string | null;
    category: string | null;
    price: number;
  }> = {},
): Promise<Listing> {
  return prisma.listing.create({
    data: {
      externalId: overrides.externalId ?? `ext-${Date.now()}-${Math.random()}`,
      source: 'VINTED',
      title: 'Test listing',
      brand: overrides.brand ?? 'Nike',
      category: overrides.category ?? 'Hoodie',
      price: overrides.price ?? 50,
      currency: 'EUR',
      url: 'https://vinted.fr/items/x',
      images: [],
    },
  });
}

// Listing.embedding is Unsupported("vector(1536)") — Prisma can't set it via `create`/`update`,
// same reason apps/worker/src/repositories/embeddings.repository.ts writes it via raw SQL.
async function setEmbedding(listingId: string, embedding: number[]): Promise<void> {
  const literal = `[${embedding.join(',')}]`;
  await prisma.$executeRaw`UPDATE "listings" SET "embedding" = ${literal}::public.vector WHERE "id" = ${listingId}`;
}

// 1536-dim vectors padded with zeros beyond the first couple of meaningful components — cosine
// similarity only cares about direction, so this is enough to exercise "close" vs. "far" without
// needing real OpenAI output in tests.
function vector(...leading: number[]): number[] {
  return [...leading, ...Array(1536 - leading.length).fill(0)];
}

describe('comparable-listings.repository', () => {
  it('returns listings matching brand and category, excluding the listing itself', async () => {
    const target = await createListing({ brand: 'Nike', category: 'Hoodie' });
    const comparable = await createListing({ brand: 'Nike', category: 'Hoodie', price: 40 });
    await createListing({ brand: 'Adidas', category: 'Hoodie' }); // different brand, excluded

    const results = await repository.findComparables({
      excludeListingId: target.id,
      brand: 'Nike',
      category: 'Hoodie',
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.price).toBe(comparable.price);
    expect(results[0]?.source).toBe('internal');
    expect(typeof results[0]?.observedAt).toBe('string');
  });

  it('matches brand case-insensitively', async () => {
    const target = await createListing({ brand: 'Nike' });
    await createListing({ brand: 'NIKE' });

    const results = await repository.findComparables({
      excludeListingId: target.id,
      brand: 'nike',
      category: null,
    });

    expect(results).toHaveLength(1);
  });

  it('returns an empty array when neither brand nor category is provided', async () => {
    const target = await createListing();

    const results = await repository.findComparables({
      excludeListingId: target.id,
      brand: null,
      category: null,
    });

    expect(results).toEqual([]);
  });

  it('respects the limit', async () => {
    const target = await createListing({ brand: 'Nike' });
    await Promise.all(Array.from({ length: 5 }, () => createListing({ brand: 'Nike', price: 30 })));

    const results = await repository.findComparables({
      excludeListingId: target.id,
      brand: 'Nike',
      category: null,
      limit: 2,
    });

    expect(results).toHaveLength(2);
  });

  it('ranks by embedding similarity when an embedding is provided, ignoring brand/category', async () => {
    const target = await createListing({ brand: 'Nike', category: 'Hoodie' });
    const close = await createListing({ brand: 'Adidas', category: 'Jacket', price: 60 });
    await setEmbedding(close.id, vector(1, 0));
    const far = await createListing({ brand: 'Nike', category: 'Hoodie', price: 999 });
    await setEmbedding(far.id, vector(0, 1));

    const results = await repository.findComparables({
      excludeListingId: target.id,
      brand: target.brand,
      category: target.category,
      embedding: vector(1, 0),
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.price).toBe(close.price);
  });

  it('excludes listings without an embedding when an embedding is provided', async () => {
    const target = await createListing();
    await createListing({ brand: 'Nike' }); // never gets an embedding set

    const results = await repository.findComparables({
      excludeListingId: target.id,
      brand: 'Nike',
      category: null,
      embedding: vector(1, 0),
    });

    expect(results).toEqual([]);
  });
});

describe('findManualComparables', () => {
  it("returns prices recorded for this listing, tagged as the 'manual' source", async () => {
    const target = await createListing();
    const user = await prisma.user.create({
      data: { email: `${Date.now()}-${Math.random()}@example.com`, password: 'hash' },
    });
    await prisma.manualComparable.create({
      data: { userId: user.id, listingId: target.id, price: 74, sourceName: 'eBay' },
    });

    const results = await repository.findManualComparables(target.id);

    expect(results).toHaveLength(1);
    expect(results[0]?.price).toBe(74);
    expect(results[0]?.source).toBe('manual');
    expect(typeof results[0]?.observedAt).toBe('string');
  });

  it('returns an empty array when the listing has no manual comparables', async () => {
    const target = await createListing();

    const results = await repository.findManualComparables(target.id);

    expect(results).toEqual([]);
  });
});
