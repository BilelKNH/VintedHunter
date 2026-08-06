import type { Analysis, Listing, Prisma, PrismaClient } from "@vinted-hunter/database";
import type { ListingsQuery } from "@vinted-hunter/shared";

export type ListingWithAnalysis = Listing & { analysis: Analysis | null };

type SortBy = ListingsQuery["sortBy"];

export interface ListingsRepository {
  findMany(params: { skip: number; take: number; sortBy?: SortBy }): Promise<ListingWithAnalysis[]>;
  count(sortBy?: SortBy): Promise<number>;
  findById(id: string): Promise<ListingWithAnalysis | null>;
}

// "score"/"profit" can only rank listings that have been analyzed — same reasoning as
// comparable-listings.repository.ts's embedding-vs-fallback split in apps/worker: never fabricate
// an order from data that doesn't exist. "newest" (the default) has no such restriction, matching
// today's unfiltered behavior exactly.
function whereForSort(sortBy: SortBy): Prisma.ListingWhereInput | undefined {
  return sortBy === "newest" ? undefined : { analysis: { isNot: null } };
}

function orderByForSort(sortBy: SortBy): Prisma.ListingOrderByWithRelationInput {
  if (sortBy === "score") return { analysis: { score: "desc" } };
  if (sortBy === "profit") return { analysis: { estimatedProfit: "desc" } };
  return { createdAt: "desc" };
}

export function createListingsRepository(prisma: PrismaClient): ListingsRepository {
  return {
    findMany: ({ skip, take, sortBy = "newest" }) =>
      prisma.listing.findMany({
        where: whereForSort(sortBy),
        skip,
        take,
        orderBy: orderByForSort(sortBy),
        include: { analysis: true },
      }),
    count: (sortBy = "newest") => prisma.listing.count({ where: whereForSort(sortBy) }),
    findById: (id) => prisma.listing.findUnique({ where: { id }, include: { analysis: true } }),
  };
}
