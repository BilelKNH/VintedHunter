import type { Analysis, PrismaClient } from '@vinted-hunter/database';

export interface AnalysisRepository {
  listingExists(listingId: string): Promise<boolean>;
  findByListingId(listingId: string): Promise<Analysis | null>;
}

export function createAnalysisRepository(prisma: PrismaClient): AnalysisRepository {
  return {
    async listingExists(listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { id: true },
      });
      return listing != null;
    },

    findByListingId(listingId) {
      return prisma.analysis.findUnique({ where: { listingId } });
    },
  };
}
