import type { Favorite, PrismaClient } from "@vinted-hunter/database";

export interface FavoritesRepository {
  find(userId: string, listingId: string): Promise<Favorite | null>;
  create(userId: string, listingId: string): Promise<Favorite>;
  delete(userId: string, listingId: string): Promise<void>;
}

export function createFavoritesRepository(prisma: PrismaClient): FavoritesRepository {
  return {
    find: (userId, listingId) =>
      prisma.favorite.findUnique({ where: { userId_listingId: { userId, listingId } } }),
    create: (userId, listingId) => prisma.favorite.create({ data: { userId, listingId } }),
    delete: async (userId, listingId) => {
      await prisma.favorite.delete({ where: { userId_listingId: { userId, listingId } } });
    },
  };
}
