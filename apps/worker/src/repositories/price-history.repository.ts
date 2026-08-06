import type { PrismaClient } from '@vinted-hunter/database';

// Feeds packages/analyzer's trend-score.ts (§ Deal Score v2) — this listing's own recorded price
// changes, oldest -> newest. PriceHistory is written on every price change (see apps/worker's
// crawl-listings.repository.ts) but was never read anywhere until now.
export async function findPriceHistoryForListing(
  prisma: PrismaClient,
  listingId: string,
): Promise<number[]> {
  const rows = await prisma.priceHistory.findMany({
    where: { listingId },
    orderBy: { createdAt: 'asc' },
    select: { price: true },
  });
  return rows.map((row) => row.price);
}
