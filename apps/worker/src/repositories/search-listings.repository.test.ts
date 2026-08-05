import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@vinted-hunter/database';
import { createTestPrismaClient } from '../test/test-prisma.js';
import { cleanDatabase } from '../test/db-cleanup.js';
import { markDelistedSearchListings } from './search-listings.repository.js';

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

async function createSearchListing(lastSeenAt: Date): Promise<{ searchId: string; listingId: string }> {
  const user = await prisma.user.create({
    data: { email: `${Date.now()}-${Math.random()}@example.com`, password: 'hash' },
  });
  const search = await prisma.search.create({
    data: {
      userId: user.id,
      name: 'Nike Tech Fleece L',
      brands: ['Nike'],
      categories: [],
      sizes: [],
      keywords: [],
      excludedKeywords: [],
      frequency: 15,
    },
  });
  const listing = await prisma.listing.create({
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
  await prisma.searchListing.create({
    data: { searchId: search.id, listingId: listing.id, lastSeenAt },
  });
  return { searchId: search.id, listingId: listing.id };
}

describe('markDelistedSearchListings', () => {
  it('marks a SearchListing delisted once lastSeenAt is older than the threshold', async () => {
    const stale = await createSearchListing(new Date(Date.now() - 7 * 60 * 60 * 1000)); // 7h ago

    await markDelistedSearchListings(prisma);

    const row = await prisma.searchListing.findUnique({
      where: { searchId_listingId: stale },
    });
    expect(row?.delistedAt).not.toBeNull();
  });

  it('leaves a recently-seen SearchListing untouched', async () => {
    const fresh = await createSearchListing(new Date());

    await markDelistedSearchListings(prisma);

    const row = await prisma.searchListing.findUnique({
      where: { searchId_listingId: fresh },
    });
    expect(row?.delistedAt).toBeNull();
  });

  it('does not overwrite an already-set delistedAt', async () => {
    const stale = await createSearchListing(new Date(Date.now() - 7 * 60 * 60 * 1000));
    const firstDelistedAt = new Date('2020-01-01');
    await prisma.searchListing.update({
      where: { searchId_listingId: stale },
      data: { delistedAt: firstDelistedAt },
    });

    await markDelistedSearchListings(prisma);

    const row = await prisma.searchListing.findUnique({
      where: { searchId_listingId: stale },
    });
    expect(row?.delistedAt).toEqual(firstDelistedAt);
  });
});
