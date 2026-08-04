import type { PrismaClient } from '@vinted-hunter/database';

export interface Comparable {
  price: number;
}

export interface ComparableListingsRepository {
  findComparables(params: {
    excludeListingId: string;
    brand: string | null;
    category: string | null;
    limit?: number;
  }): Promise<Comparable[]>;
}

const DEFAULT_LIMIT = 20;

// §24/§25: "similar listings" matched by brand+category against Postgres, not embeddings
// (vector similarity is Phase 6, §59-60) — case-insensitive since the crawler stores brand
// exactly as scraped and casing can vary between Vinted listings.
export function createComparableListingsRepository(
  prisma: PrismaClient,
): ComparableListingsRepository {
  return {
    async findComparables({ excludeListingId, brand, category, limit = DEFAULT_LIMIT }) {
      if (!brand && !category) {
        return [];
      }
      return prisma.listing.findMany({
        where: {
          id: { not: excludeListingId },
          ...(brand ? { brand: { equals: brand, mode: 'insensitive' } } : {}),
          ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { price: true },
      });
    },
  };
}
