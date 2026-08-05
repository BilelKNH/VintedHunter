import type { Analysis, Listing, PrismaClient } from "@vinted-hunter/database";

export type ListingWithAnalysis = Listing & { analysis: Analysis | null };

export interface ListingsRepository {
  findMany(params: { skip: number; take: number }): Promise<ListingWithAnalysis[]>;
  count(): Promise<number>;
  findById(id: string): Promise<ListingWithAnalysis | null>;
}

export function createListingsRepository(prisma: PrismaClient): ListingsRepository {
  return {
    findMany: ({ skip, take }) =>
      prisma.listing.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { analysis: true },
      }),
    count: () => prisma.listing.count(),
    findById: (id) => prisma.listing.findUnique({ where: { id }, include: { analysis: true } }),
  };
}
