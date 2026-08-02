import type { PrismaClient } from "@vinted-hunter/database";

// Deletes in dependent-first order so this works regardless of a given relation's onDelete
// setting (some — e.g. Purchase.listing — default to Restrict rather than Cascade).
export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.refreshToken.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.analysis.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.search.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.user.deleteMany();
}
