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
});
