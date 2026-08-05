import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import type { Listing, PrismaClient } from '@vinted-hunter/database';
import type { VisionAnalysisResult, VisionAnalyzer } from '@vinted-hunter/ai-engine';
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
    images: string[];
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
      images: overrides.images ?? [],
      sellerId: overrides.sellerId,
    },
  });
}

function fakeVisionAnalyzer(
  result: VisionAnalysisResult | (() => Promise<VisionAnalysisResult>),
): VisionAnalyzer {
  return {
    analyze: vi.fn().mockImplementation(async () =>
      typeof result === 'function' ? result() : result,
    ),
  };
}

const neutralVisionResult: VisionAnalysisResult = {
  photoQualityScore: 80,
  defects: [],
  extractedLabelText: [],
  brandLogoConsistent: true,
  counterfeitRiskFlags: [],
};

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

  it('defaults to a 30% target margin (matching Search.targetRoi) when the job carries no targetRoi', async () => {
    const listing = await createListing({ price: 50 });
    const processor = createAnalyzeListingProcessor({
      prisma,
      comparableListingsRepository: createComparableListingsRepository(prisma),
      analysisRepository: createAnalysisRepository(prisma),
      notificationQueue,
    });

    await processor(fakeJob({ listingId: listing.id }));

    const stored = await prisma.analysis.findUnique({ where: { listingId: listing.id } });
    expect(stored?.maxBuyPrice).toBeCloseTo(stored!.estimatedValue / 1.3, 2);
  });

  it('derives maxBuyPrice from the job-provided targetRoi instead of the default', async () => {
    const listing = await createListing({ price: 50 });
    const processor = createAnalyzeListingProcessor({
      prisma,
      comparableListingsRepository: createComparableListingsRepository(prisma),
      analysisRepository: createAnalysisRepository(prisma),
      notificationQueue,
    });

    await processor(fakeJob({ listingId: listing.id, targetRoi: 50 }));

    const stored = await prisma.analysis.findUnique({ where: { listingId: listing.id } });
    expect(stored?.maxBuyPrice).toBeCloseTo(stored!.estimatedValue / 1.5, 2);
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

  it('suppresses the notification when the job-provided minimumScore is higher than the score', async () => {
    const seller = await prisma.seller.create({
      data: {
        externalId: `seller-${Math.random()}`,
        username: 'trusted-seller-2',
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
          title: 'Comparable 3',
          brand: 'Stone Island',
          category: 'Jacket',
          price: 100,
          currency: 'EUR',
          url: 'https://vinted.fr/items/4',
          images: [],
        },
      }),
      prisma.listing.create({
        data: {
          externalId: `comp-${Math.random()}`,
          source: 'VINTED',
          title: 'Comparable 4',
          brand: 'Stone Island',
          category: 'Jacket',
          price: 110,
          currency: 'EUR',
          url: 'https://vinted.fr/items/5',
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

    const result = await processor(fakeJob({ listingId: listing.id, minimumScore: 99 }));

    expect(result.recommendation).toBe('STRONG_BUY');
    expect(notificationQueue.add).not.toHaveBeenCalled();
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

  it('does not call the vision analyzer when the listing has no images', async () => {
    const listing = await createListing({ images: [] });
    const visionAnalyzer = fakeVisionAnalyzer(neutralVisionResult);
    const processor = createAnalyzeListingProcessor({
      prisma,
      comparableListingsRepository: createComparableListingsRepository(prisma),
      analysisRepository: createAnalysisRepository(prisma),
      notificationQueue,
      visionAnalyzer,
    });

    await processor(fakeJob({ listingId: listing.id }));

    expect(visionAnalyzer.analyze).not.toHaveBeenCalled();
    const stored = await prisma.analysis.findUnique({ where: { listingId: listing.id } });
    expect(stored?.photoQualityScore).toBeNull();
  });

  it('persists vision fields and applies the counterfeit cap when the analyzer flags a mismatch', async () => {
    const listing = await createListing({
      images: ['https://cdn.vinted.fr/a.jpg'],
    });
    const visionAnalyzer = fakeVisionAnalyzer({
      photoQualityScore: 60,
      defects: ['Légère usure au col'],
      extractedLabelText: ['REF 1234'],
      brandLogoConsistent: false,
      counterfeitRiskFlags: ['Police du logo incorrecte'],
    });
    const processor = createAnalyzeListingProcessor({
      prisma,
      comparableListingsRepository: createComparableListingsRepository(prisma),
      analysisRepository: createAnalysisRepository(prisma),
      notificationQueue,
      visionAnalyzer,
    });

    const result = await processor(fakeJob({ listingId: listing.id }));

    expect(visionAnalyzer.analyze).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrls: ['https://cdn.vinted.fr/a.jpg'] }),
    );
    expect(result.score).toBeLessThanOrEqual(50);
    const stored = await prisma.analysis.findUnique({ where: { listingId: listing.id } });
    expect(stored?.brandLogoConsistent).toBe(false);
    expect(stored?.defects).toEqual(['Légère usure au col']);
    expect(stored?.visionAnalyzedAt).not.toBeNull();
    expect(notificationQueue.add).not.toHaveBeenCalled();
  });

  it('completes the job and leaves vision fields null when the vision analyzer throws', async () => {
    const listing = await createListing({ images: ['https://cdn.vinted.fr/a.jpg'] });
    const visionAnalyzer: VisionAnalyzer = {
      analyze: vi.fn().mockRejectedValue(new Error('Anthropic API unavailable')),
    };
    const processor = createAnalyzeListingProcessor({
      prisma,
      comparableListingsRepository: createComparableListingsRepository(prisma),
      analysisRepository: createAnalysisRepository(prisma),
      notificationQueue,
      visionAnalyzer,
    });

    const result = await processor(fakeJob({ listingId: listing.id }));

    expect(result.analyzed).toBe(true);
    const stored = await prisma.analysis.findUnique({ where: { listingId: listing.id } });
    expect(stored?.photoQualityScore).toBeNull();
    expect(stored?.visionAnalyzedAt).toBeNull();
  });

  it('does not call the vision analyzer when none is configured', async () => {
    const listing = await createListing({ images: ['https://cdn.vinted.fr/a.jpg'] });
    const processor = createAnalyzeListingProcessor({
      prisma,
      comparableListingsRepository: createComparableListingsRepository(prisma),
      analysisRepository: createAnalysisRepository(prisma),
      notificationQueue,
      visionAnalyzer: null,
    });

    const result = await processor(fakeJob({ listingId: listing.id }));

    expect(result.analyzed).toBe(true);
  });
});
