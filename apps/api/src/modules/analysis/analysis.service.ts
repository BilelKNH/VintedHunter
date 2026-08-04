import type { Analysis } from '@vinted-hunter/database';
import { recommendationForScore, type Recommendation } from '@vinted-hunter/analyzer';
import type { AnalyzeListingJobData } from '@vinted-hunter/shared';
import { NotFoundError } from '../../utils/errors.js';
import type { AnalysisRepository } from './analysis.repository.js';

// Narrow slice of BullMQ's Queue API — a real Queue satisfies this structurally, tests inject a
// fake without spinning up Redis (same pattern as apps/worker's scheduler.ts/analyze-listing.job.ts).
export interface AnalysisQueueProducer {
  add(name: string, data: AnalyzeListingJobData): Promise<unknown>;
}

export interface AnalysisServiceDeps {
  analysisRepository: AnalysisRepository;
  queue: AnalysisQueueProducer;
}

export interface AnalysisWithRecommendation extends Analysis {
  recommendation: Recommendation;
}

const ANALYZE_LISTING_JOB_NAME = 'analyze-listing';

export function createAnalysisService({ analysisRepository, queue }: AnalysisServiceDeps) {
  return {
    async triggerAnalysis(listingId: string): Promise<{ enqueued: boolean }> {
      const exists = await analysisRepository.listingExists(listingId);
      if (!exists) {
        throw new NotFoundError('Listing not found');
      }
      await queue.add(ANALYZE_LISTING_JOB_NAME, { listingId, manual: true });
      return { enqueued: true };
    },

    async getByListingId(listingId: string): Promise<AnalysisWithRecommendation> {
      const analysis = await analysisRepository.findByListingId(listingId);
      if (!analysis) {
        throw new NotFoundError('Analysis not found');
      }
      return { ...analysis, recommendation: recommendationForScore(analysis.score) };
    },
  };
}
