import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@vinted-hunter/database';
import { createTestPrismaClient } from '../test/test-prisma.js';
import { cleanDatabase } from '../test/db-cleanup.js';
import { findPriceHistoryForListing } from './price-history.repository.js';

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

async function createListing() {
  return prisma.listing.create({
    data: {
      externalId: `ext-${Date.now()}-${Math.random()}`,
      source: 'VINTED',
      title: 'Test listing',
      price: 50,
      currency: 'EUR',
      url: 'https://vinted.fr/items/x',
      images: [],
    },
  });
}

describe('findPriceHistoryForListing', () => {
  it('returns prices oldest to newest', async () => {
    const listing = await createListing();
    await prisma.priceHistory.create({ data: { listingId: listing.id, price: 80 } });
    await prisma.priceHistory.create({ data: { listingId: listing.id, price: 70 } });

    const history = await findPriceHistoryForListing(prisma, listing.id);

    expect(history).toEqual([80, 70]);
  });

  it('returns an empty array when the listing has no recorded price changes', async () => {
    const listing = await createListing();

    const history = await findPriceHistoryForListing(prisma, listing.id);

    expect(history).toEqual([]);
  });
});
