import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { AnalysisResult } from '@vinted-hunter/analyzer';
import type { Listing, PrismaClient } from '@vinted-hunter/database';
import { createTestPrismaClient } from '../test/test-prisma.js';
import { cleanDatabase } from '../test/db-cleanup.js';
import { createAnalysisRepository, type AnalysisRepository } from './analysis.repository.js';

let prisma: PrismaClient;
let repository: AnalysisRepository;

beforeAll(() => {
  prisma = createTestPrismaClient();
  repository = createAnalysisRepository(prisma);
});

afterEach(async () => {
  await cleanDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createListing(): Promise<Listing> {
  return prisma.listing.create({
    data: {
      externalId: `ext-${Date.now()}-${Math.random()}`,
      source: 'VINTED',
      title: 'Nike Tech Fleece Hoodie',
      price: 29,
      currency: 'EUR',
      url: 'https://vinted.fr/items/1',
      images: [],
    },
  });
}

function analysisResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    score: 95,
    priceScore: 100,
    brandScore: 95,
    conditionScore: 80,
    liquidityScore: 82,
    authenticityScore: 69,
    estimatedValue: 100,
    estimatedProfit: 71,
    roi: 245,
    recommendation: 'STRONG_BUY',
    explanation: ['Prix 71% sous la valeur marché estimée'],
    ...overrides,
  };
}

describe('analysis.repository', () => {
  it('creates a new Analysis row for a listing', async () => {
    const listing = await createListing();

    const analysis = await repository.upsertForListing(listing.id, analysisResult());

    expect(analysis.listingId).toBe(listing.id);
    expect(analysis.score).toBe(95);
    expect(analysis.explanation).toEqual(['Prix 71% sous la valeur marché estimée']);
  });

  it('is idempotent for the same listingId — updates instead of duplicating', async () => {
    const listing = await createListing();

    await repository.upsertForListing(listing.id, analysisResult({ score: 60 }));
    const updated = await repository.upsertForListing(listing.id, analysisResult({ score: 95 }));

    expect(updated.score).toBe(95);
    const count = await prisma.analysis.count();
    expect(count).toBe(1);
  });

  it('findByListingId returns null when no analysis exists', async () => {
    const listing = await createListing();

    await expect(repository.findByListingId(listing.id)).resolves.toBeNull();
  });

  it('findByListingId returns the persisted analysis', async () => {
    const listing = await createListing();
    await repository.upsertForListing(listing.id, analysisResult());

    const found = await repository.findByListingId(listing.id);

    expect(found?.score).toBe(95);
  });
});
