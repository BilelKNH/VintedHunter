import type { Listing, Prisma, PrismaClient, Purchase } from "@vinted-hunter/database";

export type PurchaseWithListing = Purchase & { listing: Listing };

export interface PurchaseStatsRow {
  totalPurchased: number;
  totalSold: number;
  totalPending: number;
  totalInvested: number;
  totalRealizedProfit: number;
  averageRealizedRoi: number | null;
}

export interface PurchasesRepository {
  create(data: {
    userId: string;
    listingId: string;
    purchasePrice: number;
  }): Promise<PurchaseWithListing>;
  findById(id: string): Promise<PurchaseWithListing | null>;
  // PENDING only — used to block a second concurrent purchase of the same listing.
  findActiveByListingId(userId: string, listingId: string): Promise<Purchase | null>;
  // PENDING or SOLD (the most recent one) — used to render a listing's purchase state
  // (buy form / owned / sold-with-profit). CANCELLED purchases are excluded so a listing
  // reverts to the plain buy form after its purchase is cancelled, as if it never happened.
  findDisplayableByListingId(userId: string, listingId: string): Promise<Purchase | null>;
  update(id: string, data: Prisma.PurchaseUpdateInput): Promise<PurchaseWithListing>;
  findAllByUserId(
    userId: string,
    params: { skip: number; take: number },
  ): Promise<PurchaseWithListing[]>;
  countByUserId(userId: string): Promise<number>;
  getStatsByUserId(userId: string): Promise<PurchaseStatsRow>;
}

export function createPurchasesRepository(prisma: PrismaClient): PurchasesRepository {
  return {
    create: ({ userId, listingId, purchasePrice }) =>
      prisma.purchase.create({
        data: { userId, listingId, purchasePrice },
        include: { listing: true },
      }),

    findById: (id) => prisma.purchase.findUnique({ where: { id }, include: { listing: true } }),

    findActiveByListingId: (userId, listingId) =>
      prisma.purchase.findFirst({ where: { userId, listingId, status: "PENDING" } }),

    findDisplayableByListingId: (userId, listingId) =>
      prisma.purchase.findFirst({
        where: { userId, listingId, status: { in: ["PENDING", "SOLD"] } },
        orderBy: { createdAt: "desc" },
      }),

    update: (id, data) =>
      prisma.purchase.update({ where: { id }, data, include: { listing: true } }),

    findAllByUserId: (userId, { skip, take }) =>
      prisma.purchase.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { listing: true },
      }),

    countByUserId: (userId) => prisma.purchase.count({ where: { userId } }),

    async getStatsByUserId(userId) {
      const [pendingCount, sold, totalCount] = await Promise.all([
        prisma.purchase.count({ where: { userId, status: "PENDING" } }),
        prisma.purchase.findMany({
          where: { userId, status: "SOLD" },
          select: { purchasePrice: true, profit: true },
        }),
        prisma.purchase.count({ where: { userId, status: { not: "CANCELLED" } } }),
      ]);

      const totalRealizedProfit = sold.reduce((sum, row) => sum + (row.profit ?? 0), 0);
      const totalSoldInvested = sold.reduce((sum, row) => sum + row.purchasePrice, 0);
      const allActive = await prisma.purchase.aggregate({
        where: { userId, status: { not: "CANCELLED" } },
        _sum: { purchasePrice: true },
      });

      return {
        totalPurchased: totalCount,
        totalSold: sold.length,
        totalPending: pendingCount,
        totalInvested: allActive._sum.purchasePrice ?? 0,
        totalRealizedProfit,
        averageRealizedRoi:
          sold.length > 0 && totalSoldInvested > 0
            ? (totalRealizedProfit / totalSoldInvested) * 100
            : null,
      };
    },
  };
}
