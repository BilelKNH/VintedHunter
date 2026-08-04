import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import type { Listing, PrismaClient } from '@vinted-hunter/database';
import { createTestPrismaClient } from '../test/test-prisma.js';
import { cleanDatabase } from '../test/db-cleanup.js';
import { createComparableListingsRepository } from '../repositories/comparable-listings.repository.js';
import { createAnalysisRepository } from '../repositories/analysis.repository.js';
import { createAnalyzeListingProcessor, type NotificationQueue } from './analyze-listing.job.js';
import type { AnalyzeListingJobData } from '@vinted-hunter/shared';

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

function fakeJob(data: AnalyzeListingJobData): Job<AnalyzeListingJobData> {
  return { data } as Job<AnalyzeListingJobData>;
}

async function createListing(
  overrides: Partial<{
    brand: string | null;
    category: string | null;
    price: number;
    title: string;
    condition: string | null;
    description: string | null;
    sellerId: string;
  }> = {},
): Promise<Listing> {
  return prisma.listing.create({
    data: {
      externalId: `ext-${Date.now()}-${Math.random()}`,
      source: 'VINTED',
      title: overrides.title ?? 'Stone Island Shadow Project Jacket',
      description: overrides.description,
      brand: overrides.brand ?? 'Stone Island',
      category: overrides.category ?? 'Jacket',
      condition: overrides.condition ?? 'Neuf avec étiquette',
      price: overrides.price ?? 20,
      currency: 'EUR',
      url: 'https://vinted.fr/items/1',
      images: [],
      sellerId: overrides.sellerId,
    },
  });
}

describe('analyze-listing job processor', () => {
  let notificationQueue: NotificationQueue;

  beforeEach(() => {
    notificationQueue = { add: vi.fn().mockResolvedValue(undefined) };
  });

  it('persists an Analysis row for an existing listing', async () => {
    const listing = await createListing();
    const processor = createAnalyzeListingProcessor({
      prisma,
      comparableListingsRepository: createComparableListingsRepository(prisma),
      analysisRepository: createAnalysisRepository(prisma),
      notificationQueue,
    });

    const result = await processor(fakeJob({ listingId: listing.id }));

    expect(result.analyzed).toBe(true);
    const stored = await prisma.analysis.findUnique({ where: { listingId: listing.id } });
    expect(stored).not.toBeNull();
    expect(stored?.score).toBe(result.score);
  });

  it('does nothing for a listingId that does not exist', async () => {
    const processor = createAnalyzeListingProcessor({
      prisma,
      comparableListingsRepository: createComparableListingsRepository(prisma),
      analysisRepository: createAnalysisRepository(prisma),
      notificationQueue,
    });

    const result = await processor(fakeJob({ listingId: 'missing-listing' }));

    expect(result).toEqual({ analyzed: false });
    expect(notificationQueue.add).not.toHaveBeenCalled();
  });

  it('enqueues a send-notification job when the analysis clears the §47 threshold', async () => {
    // Great deal: well under comparable prices, hot brand, mint condition, detailed
    // description, trusted seller -> clears score/roi/profit bars without tripping the
    // price-anomaly authenticity penalty (kept above the "suspiciously cheap" ratio).
    const seller = await prisma.seller.create({
      data: {
        externalId: `seller-${Math.random()}`,
        username: 'trusted-seller',
        rating: 5,
        reviews: 200,
      },
    });
    const listing = await createListing({
      price: 50,
      description:
        'Achetée en boutique en 2023, portée deux fois seulement, aucun défaut, étiquette conservée.',
      sellerId: seller.id,
    });
    await Promise.all([
      prisma.listing.create({
        data: {
          externalId: `comp-${Math.random()}`,
          source: 'VINTED',
          title: 'Comparable 1',
          brand: 'Stone Island',
          category: 'Jacket',
          price: 100,
          currency: 'EUR',
          url: 'https://vinted.fr/items/2',
          images: [],
        },
      }),
      prisma.listing.create({
        data: {
          externalId: `comp-${Math.random()}`,
          source: 'VINTED',
          title: 'Comparable 2',
          brand: 'Stone Island',
          category: 'Jacket',
          price: 110,
          currency: 'EUR',
          url: 'https://vinted.fr/items/3',
          images: [],
        },
      }),
    ]);

    const processor = createAnalyzeListingProcessor({
      prisma,
      comparableListingsRepository: createComparableListingsRepository(prisma),
      analysisRepository: createAnalysisRepository(prisma),
      notificationQueue,
    });

    const result = await processor(fakeJob({ listingId: listing.id }));

    expect(result.recommendation).toBe('STRONG_BUY');
    expect(notificationQueue.add).toHaveBeenCalledWith(
      'send-notification',
      expect.objectContaining({ analysisId: expect.any(String) }),
    );
  });

  it('does not enqueue a notification for a mediocre analysis', async () => {
    const listing = await createListing({
      price: 90,
      brand: null,
      condition: 'Satisfaisant',
      description: 'Bon état',
    });

    const processor = createAnalyzeListingProcessor({
      prisma,
      comparableListingsRepository: createComparableListingsRepository(prisma),
      analysisRepository: createAnalysisRepository(prisma),
      notificationQueue,
    });

    await processor(fakeJob({ listingId: listing.id }));

    expect(notificationQueue.add).not.toHaveBeenCalled();
  });
});
