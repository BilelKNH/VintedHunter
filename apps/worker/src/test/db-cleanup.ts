import type { PrismaClient } from '@vinted-hunter/database';

// Deletes in dependent-first order — mirrors apps/api/src/test/db-cleanup.ts (same schema,
// same test database, kept as a separate copy since apps/api/src isn't a shared package).
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
