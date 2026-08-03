import type { Favorite, Listing, PrismaClient } from "@vinted-hunter/database";

export interface FavoritesRepository {
  find(userId: string, listingId: string): Promise<Favorite | null>;
  create(userId: string, listingId: string): Promise<Favorite>;
  delete(userId: string, listingId: string): Promise<void>;
  findAllByUserId(userId: string, params: { skip: number; take: number }): Promise<Listing[]>;
  countByUserId(userId: string): Promise<number>;
}

export function createFavoritesRepository(prisma: PrismaClient): FavoritesRepository {
  return {
    find: (userId, listingId) =>
      prisma.favorite.findUnique({ where: { userId_listingId: { userId, listingId } } }),
    create: (userId, listingId) => prisma.favorite.create({ data: { userId, listingId } }),
    delete: async (userId, listingId) => {
      await prisma.favorite.delete({ where: { userId_listingId: { userId, listingId } } });
    },
    findAllByUserId: async (userId, { skip, take }) => {
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { listing: true },
      });
      return favorites.map((favorite) => favorite.listing);
    },
    countByUserId: (userId) => prisma.favorite.count({ where: { userId } }),
  };
}
