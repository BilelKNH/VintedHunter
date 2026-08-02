import type { Listing, PrismaClient } from "@vinted-hunter/database";

export interface ListingsRepository {
  findMany(params: { skip: number; take: number }): Promise<Listing[]>;
  count(): Promise<number>;
  findById(id: string): Promise<Listing | null>;
}

export function createListingsRepository(prisma: PrismaClient): ListingsRepository {
  return {
    findMany: ({ skip, take }) =>
      prisma.listing.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
    count: () => prisma.listing.count(),
    findById: (id) => prisma.listing.findUnique({ where: { id } }),
  };
}
