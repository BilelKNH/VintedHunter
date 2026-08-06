import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../../test/build-test-app.js';
import { cleanDatabase } from '../../test/db-cleanup.js';
import { createTestListing } from '../../test/factories.js';

let testApp: TestApp;

beforeAll(() => {
  testApp = buildTestApp();
});

afterEach(async () => {
  await cleanDatabase(testApp.prisma);
});

afterAll(async () => {
  await testApp.close();
});

async function registerUser(email: string): Promise<string> {
  const response = await testApp.app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password: 'correct-horse-battery' },
  });
  return response.json().data.accessToken as string;
}

describe('/analysis', () => {
  describe('POST /analysis/:id', () => {
    it('rejects requests without a token', async () => {
      const listing = await createTestListing(testApp.prisma);

      const response = await testApp.app.inject({ method: 'POST', url: `/analysis/${listing.id}` });

      expect(response.statusCode).toBe(401);
    });

    it('enqueues an analyze-listing job for an existing listing', async () => {
      const token = await registerUser('owner@example.com');
      const listing = await createTestListing(testApp.prisma);

      const response = await testApp.app.inject({
        method: 'POST',
        url: `/analysis/${listing.id}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(202);
      expect(response.json().data).toEqual({ enqueued: true });
      expect(testApp.analysisQueue.add).toHaveBeenCalledWith('analyze-listing', {
        listingId: listing.id,
        manual: true,
      });
    });

    it('returns 404 for a listing that does not exist', async () => {
      const token = await registerUser('owner2@example.com');

      const response = await testApp.app.inject({
        method: 'POST',
        url: '/analysis/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /analysis/:id', () => {
    it('returns 404 when no analysis exists yet', async () => {
      const listing = await createTestListing(testApp.prisma);

      const response = await testApp.app.inject({ method: 'GET', url: `/analysis/${listing.id}` });

      expect(response.statusCode).toBe(404);
    });

    it('returns the persisted analysis with a derived recommendation', async () => {
      const listing = await createTestListing(testApp.prisma);
      await testApp.prisma.analysis.create({
        data: {
          listingId: listing.id,
          score: 95,
          priceScore: 100,
          brandScore: 95,
          conditionScore: 80,
          liquidityScore: 90,
          authenticityScore: 90,
          estimatedValue: 100,
          estimatedValueLow: 90,
          estimatedValueHigh: 110,
          confidence: 75,
          estimatedProfit: 71,
          roi: 245,
          maxBuyPrice: 76.92,
          explanation: ['Prix 71% sous la valeur marché estimée'],
        },
      });

      const response = await testApp.app.inject({ method: 'GET', url: `/analysis/${listing.id}` });

      expect(response.statusCode).toBe(200);
      const body = response.json().data;
      expect(body.score).toBe(95);
      expect(body.recommendation).toBe('STRONG_BUY');
      expect(body.explanation).toEqual(['Prix 71% sous la valeur marché estimée']);
    });

    it('does not require authentication', async () => {
      const listing = await createTestListing(testApp.prisma);
      await testApp.prisma.analysis.create({
        data: {
          listingId: listing.id,
          score: 60,
          priceScore: 50,
          brandScore: 40,
          conditionScore: 50,
          liquidityScore: 50,
          authenticityScore: 50,
          estimatedValue: 50,
          estimatedValueLow: 50,
          estimatedValueHigh: 50,
          confidence: 40,
          estimatedProfit: 0,
          roi: 0,
          maxBuyPrice: 38.46,
          explanation: [],
        },
      });

      const response = await testApp.app.inject({ method: 'GET', url: `/analysis/${listing.id}` });

      expect(response.statusCode).toBe(200);
    });
  });
});
