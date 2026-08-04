import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Analysis } from '@vinted-hunter/database';
import { createAnalysisService, type AnalysisQueueProducer } from './analysis.service.js';
import type { AnalysisRepository } from './analysis.repository.js';
import { NotFoundError } from '../../utils/errors.js';

function fakeAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: 'analysis-1',
    listingId: 'listing-1',
    score: 96,
    priceScore: 100,
    brandScore: 95,
    conditionScore: 80,
    liquidityScore: 90,
    authenticityScore: 90,
    estimatedValue: 100,
    estimatedProfit: 71,
    roi: 245,
    explanation: ['Prix 71% sous la valeur marché estimée'],
    createdAt: new Date(),
    photoQualityScore: null,
    defects: null,
    extractedLabelText: null,
    brandLogoConsistent: null,
    counterfeitRiskFlags: null,
    visionAnalyzedAt: null,
    ...overrides,
  };
}

describe('analysis.service', () => {
  let analysisRepository: AnalysisRepository;
  let queue: AnalysisQueueProducer;
  let service: ReturnType<typeof createAnalysisService>;

  beforeEach(() => {
    analysisRepository = { listingExists: vi.fn(), findByListingId: vi.fn() };
    queue = { add: vi.fn() };
    service = createAnalysisService({ analysisRepository, queue });
  });

  describe('triggerAnalysis', () => {
    it('enqueues an analyze-listing job for an existing listing', async () => {
      vi.mocked(analysisRepository.listingExists).mockResolvedValue(true);

      const result = await service.triggerAnalysis('listing-1');

      expect(result).toEqual({ enqueued: true });
      expect(queue.add).toHaveBeenCalledWith('analyze-listing', {
        listingId: 'listing-1',
        manual: true,
      });
    });

    it('throws NotFoundError for a listing that does not exist', async () => {
      vi.mocked(analysisRepository.listingExists).mockResolvedValue(false);

      await expect(service.triggerAnalysis('missing')).rejects.toThrow(NotFoundError);
      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('getByListingId', () => {
    it('returns the analysis with a derived recommendation', async () => {
      vi.mocked(analysisRepository.findByListingId).mockResolvedValue(fakeAnalysis({ score: 96 }));

      const result = await service.getByListingId('listing-1');

      expect(result.recommendation).toBe('STRONG_BUY');
      expect(result.score).toBe(96);
    });

    it('derives GOOD_OPPORTUNITY for a score in the 75-90 band', async () => {
      vi.mocked(analysisRepository.findByListingId).mockResolvedValue(fakeAnalysis({ score: 80 }));

      const result = await service.getByListingId('listing-1');

      expect(result.recommendation).toBe('GOOD_OPPORTUNITY');
    });

    it('throws NotFoundError when no analysis exists yet', async () => {
      vi.mocked(analysisRepository.findByListingId).mockResolvedValue(null);

      await expect(service.getByListingId('listing-1')).rejects.toThrow(NotFoundError);
    });
  });
});
