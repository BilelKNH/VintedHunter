import type { Job } from 'bullmq';
import type { PrismaClient } from '@vinted-hunter/database';
import { computeAnalysis, type ListingForAnalysis } from '@vinted-hunter/analyzer';
import { estimateMarketPrice } from '@vinted-hunter/pricing-engine';
import { shouldNotify } from '@vinted-hunter/notifications';
import type { AnalyzeListingJobData } from '@vinted-hunter/shared';
import type { ComparableListingsRepository } from '../repositories/comparable-listings.repository.js';
import type { AnalysisRepository } from '../repositories/analysis.repository.js';
import type { SendNotificationJobData } from '../queue/queues.js';

const MAX_COMPARABLES = 20;
const SEND_NOTIFICATION_JOB_NAME = 'send-notification';

// Narrow slice of BullMQ's Queue API (mirrors apps/worker/src/queue/scheduler.ts's
// SchedulerQueue pattern) so tests can inject a fake without spinning up Redis.
export interface NotificationQueue {
  add(name: string, data: SendNotificationJobData): Promise<unknown>;
}

export interface AnalyzeListingJobDeps {
  prisma: PrismaClient;
  comparableListingsRepository: ComparableListingsRepository;
  analysisRepository: AnalysisRepository;
  notificationQueue: NotificationQueue;
}

export interface AnalyzeListingJobResult {
  analyzed: boolean;
  score?: number;
  recommendation?: string;
}

export function createAnalyzeListingProcessor(deps: AnalyzeListingJobDeps) {
  return async function processAnalyzeListingJob(
    job: Job<AnalyzeListingJobData>,
  ): Promise<AnalyzeListingJobResult> {
    const { listingId } = job.data;

    const listing = await deps.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });
    if (!listing) {
      return { analyzed: false };
    }

    const comparables = await deps.comparableListingsRepository.findComparables({
      excludeListingId: listing.id,
      brand: listing.brand,
      category: listing.category,
      limit: MAX_COMPARABLES,
    });

    const priceEstimate = estimateMarketPrice(comparables, {
      brand: listing.brand,
      condition: listing.condition,
      fallbackPrice: listing.price,
    });

    const listingForAnalysis: ListingForAnalysis = {
      title: listing.title,
      description: listing.description,
      brand: listing.brand,
      category: listing.category,
      size: listing.size,
      condition: listing.condition,
      price: listing.price,
      currency: listing.currency,
      seller: listing.seller
        ? {
            rating: listing.seller.rating,
            reviews: listing.seller.reviews,
            accountAge: listing.seller.accountAge,
            totalListings: listing.seller.totalListings,
            riskScore: listing.seller.riskScore,
          }
        : null,
    };

    const analysisResult = computeAnalysis({
      listing: listingForAnalysis,
      market: {
        estimatedValue: priceEstimate.estimatedValue,
        comparableCount: priceEstimate.comparableCount,
      },
    });

    const analysis = await deps.analysisRepository.upsertForListing(listing.id, analysisResult);

    if (shouldNotify(analysisResult)) {
      await deps.notificationQueue.add(SEND_NOTIFICATION_JOB_NAME, { analysisId: analysis.id });
    }

    return {
      analyzed: true,
      score: analysisResult.score,
      recommendation: analysisResult.recommendation,
    };
  };
}
