import type { CrawledListing } from '@vinted-hunter/crawler';
import { Prisma, type Listing, type PrismaClient } from '@vinted-hunter/database';

export interface UpsertListingResult {
  listing: Listing;
  isNew: boolean;
  priceChanged: boolean;
}

export interface CrawlListingsRepository {
  findExistingExternalIds(externalIds: string[]): Promise<Set<string>>;
  upsertListing(data: CrawledListing, searchId: string): Promise<UpsertListingResult>;
}

const MAX_SERIALIZATION_RETRIES = 3;

function isSerializationConflict(error: unknown): boolean {
  // P2034 = "transaction failed due to a write conflict or a deadlock" — expected and
  // retryable under Serializable isolation, not a real failure.
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
}

async function runWithSerializableRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_SERIALIZATION_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isSerializationConflict(error) || attempt === MAX_SERIALIZATION_RETRIES) {
        throw error;
      }
    }
  }
  // Unreachable — the loop above always either returns or throws.
  throw new Error('runWithSerializableRetry: exhausted retries without a result');
}

export function createCrawlListingsRepository(prisma: PrismaClient): CrawlListingsRepository {
  return {
    async findExistingExternalIds(externalIds) {
      if (externalIds.length === 0) {
        return new Set();
      }
      const rows = await prisma.listing.findMany({
        where: { externalId: { in: externalIds } },
        select: { externalId: true },
      });
      return new Set(rows.map((row) => row.externalId));
    },

    async upsertListing(data, searchId) {
      // Two different Searches can easily match the same Vinted item, so concurrent
      // crawl-search jobs (Worker concurrency = MAX_WORKERS) can race on the same externalId.
      // Serializable isolation + retry-on-conflict prevents both from reading the same stale
      // price and both writing a PriceHistory row for what is really a single price change.
      return runWithSerializableRetry(() =>
        prisma.$transaction(
          async (tx) => {
            const seller = data.seller
              ? await tx.seller.upsert({
                  where: { externalId: data.seller.externalId },
                  create: {
                    externalId: data.seller.externalId,
                    username: data.seller.username,
                    rating: data.seller.rating,
                    reviews: data.seller.reviews,
                  },
                  update: {
                    username: data.seller.username,
                    rating: data.seller.rating,
                    reviews: data.seller.reviews,
                  },
                })
              : null;

            const existing = await tx.listing.findUnique({
              where: { externalId: data.externalId },
            });
            const priceChanged = existing != null && existing.price !== data.price;

            const listing = await tx.listing.upsert({
              where: { externalId: data.externalId },
              create: {
                externalId: data.externalId,
                source: data.source,
                title: data.title,
                description: data.description,
                brand: data.brand,
                category: data.category,
                size: data.size,
                condition: data.condition,
                price: data.price,
                currency: data.currency,
                url: data.url,
                images: data.images,
                sellerId: seller?.id,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
              },
              update: {
                title: data.title,
                description: data.description,
                brand: data.brand,
                category: data.category,
                size: data.size,
                condition: data.condition,
                price: data.price,
                currency: data.currency,
                images: data.images,
                sellerId: seller?.id,
              },
            });

            if (priceChanged) {
              await tx.priceHistory.create({ data: { listingId: listing.id, price: data.price } });
            }

            // Marks this listing as still-live for this search — feeds delisting detection
            // (markDelistedSearchListings) rather than anything read in this job. Upsert instead
            // of create because the same listing legitimately gets re-seen across many crawls.
            await tx.searchListing.upsert({
              where: { searchId_listingId: { searchId, listingId: listing.id } },
              create: { searchId, listingId: listing.id },
              update: { lastSeenAt: new Date(), delistedAt: null },
            });

            return { listing, isNew: existing == null, priceChanged };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );
    },
  };
}
