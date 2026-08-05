import type { ManualComparable, PrismaClient } from "@vinted-hunter/database";

export interface CreateManualComparableData {
  userId: string;
  listingId: string;
  price: number;
  currency: string;
  sourceName: string;
  sourceUrl: string | null;
  note: string | null;
}

export interface ManualComparablesRepository {
  findByListingId(listingId: string): Promise<ManualComparable[]>;
  findById(id: string): Promise<ManualComparable | null>;
  create(data: CreateManualComparableData): Promise<ManualComparable>;
  delete(id: string): Promise<void>;
}

export function createManualComparablesRepository(
  prisma: PrismaClient,
): ManualComparablesRepository {
  return {
    findByListingId: (listingId) =>
      prisma.manualComparable.findMany({
        where: { listingId },
        orderBy: { createdAt: "desc" },
      }),
    findById: (id) => prisma.manualComparable.findUnique({ where: { id } }),
    create: (data) => prisma.manualComparable.create({ data }),
    delete: async (id) => {
      await prisma.manualComparable.delete({ where: { id } });
    },
  };
}
