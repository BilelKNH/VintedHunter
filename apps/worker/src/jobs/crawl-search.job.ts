import type { Job } from 'bullmq';
import type { PrismaClient, Search } from '@vinted-hunter/database';
import {
  matchesSearchCriteria,
  normalizeListing,
  parseListing,
  type ParsedListing,
  type SearchConfiguration,
} from '@vinted-hunter/crawler';
import type { AnalyzeListingJobData } from '@vinted-hunter/shared';
import type { CrawlSearchJobData } from '../queue/queues.js';
import type { CrawlCache } from '../cache/crawl-cache.js';
import type { CrawlListingsRepository } from '../repositories/crawl-listings.repository.js';

// Matches @vinted-hunter/crawler's VintedClient shape — declared locally so this module
// doesn't need to know about the Playwright-backed implementation (see
// browser/playwright-session.ts, which is what actually constructs one).
export interface VintedSearchClient {
  searchPages(
    search: SearchConfiguration,
    options?: { maxPages?: number; perPage?: number },
  ): AsyncGenerator<unknown[]>;
}

// Narrow slice of BullMQ's Queue API, same pattern as analyze-listing.job.ts's
// NotificationQueue — lets tests inject a fake without spinning up Redis.
export interface AnalyzeListingQueue {
  add(name: string, data: AnalyzeListingJobData): Promise<unknown>;
}

const ANALYZE_LISTING_JOB_NAME = 'analyze-listing';

export interface CrawlSearchJobDeps {
  prisma: PrismaClient;
  vintedClient: VintedSearchClient;
  listingsRepository: CrawlListingsRepository;
  cache: CrawlCache;
  analyzeListingQueue: AnalyzeListingQueue;
}

export interface CrawlSearchJobResult {
  collected: number;
  new: number;
}

// Safety cap on how many result pages a single crawl-search run will fetch — §11.7's "éviter
// les appels inutiles" in practice: a full crawl loop already breaks early once a page has no
// new listings, this is just the hard ceiling for pathological cases.
const MAX_PAGES_PER_SEARCH = 5;

function toSearchConfiguration(search: Search): SearchConfiguration {
  return {
    id: search.id,
    name: search.name,
    brands: search.brands,
    categories: search.categories,
    sizes: search.sizes,
    keywords: search.keywords,
    excludedKeywords: search.excludedKeywords,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
  };
}

export function createCrawlSearchProcessor(deps: CrawlSearchJobDeps) {
  return async function processCrawlSearchJob(
    job: Job<CrawlSearchJobData>,
  ): Promise<CrawlSearchJobResult> {
    const { searchId, manual } = job.data;

    if (!manual && (await deps.cache.shouldSkip(searchId))) {
      return { collected: 0, new: 0 };
    }

    const search = await deps.prisma.search.findUnique({ where: { id: searchId } });
    if (!search || !search.enabled) {
      return { collected: 0, new: 0 };
    }

    const searchConfig = toSearchConfiguration(search);
    let collected = 0;
    let newCount = 0;

    for await (const page of deps.vintedClient.searchPages(searchConfig, {
      maxPages: MAX_PAGES_PER_SEARCH,
    })) {
      const parsed = page
        .map((raw) => parseListing(raw))
        .filter((item): item is ParsedListing => item !== null);
      if (parsed.length === 0) {
        break;
      }

      const existingIds = await deps.listingsRepository.findExistingExternalIds(
        parsed.map((item) => item.externalId),
      );
      const newInPage = parsed.filter((item) => !existingIds.has(item.externalId));

      for (const item of parsed) {
        const normalized = normalizeListing(item, searchConfig);
        if (!matchesSearchCriteria(normalized, searchConfig)) {
          continue;
        }
        const result = await deps.listingsRepository.upsertListing(normalized, search.id);
        collected += 1;
        if (result.isNew) {
          newCount += 1;
          // Completes §11.4's crawl -> analyse -> notify pipeline: only newly-collected
          // listings need scoring, re-crawled/already-known ones already have an Analysis.
          await deps.analyzeListingQueue.add(ANALYZE_LISTING_JOB_NAME, {
            listingId: result.listing.id,
            targetRoi: search.targetRoi,
            minimumScore: search.minimumScore,
            userId: search.userId,
          });
        }
      }

      if (newInPage.length === 0) {
        break;
      }
    }

    await deps.cache.markCrawled(searchId);
    return { collected, new: newCount };
  };
}
