import type { Listing } from "@vinted-hunter/database";
import { NotFoundError } from "../../utils/errors.js";
import type { FavoritesRepository } from "./favorites.repository.js";
import type { ListingsRepository } from "./listings.repository.js";

export interface ListingsServiceDeps {
  listingsRepository: ListingsRepository;
  favoritesRepository: FavoritesRepository;
}

export interface ListingsPage {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
}

export function createListingsService({ listingsRepository, favoritesRepository }: ListingsServiceDeps) {
  return {
    async list(page: number, limit: number): Promise<ListingsPage> {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        listingsRepository.findMany({ skip, take: limit }),
        listingsRepository.count(),
      ]);
      return { items, total, page, limit };
    },

    async getById(id: string): Promise<Listing> {
      const listing = await listingsRepository.findById(id);
      if (!listing) {
        throw new NotFoundError("Listing not found");
      }
      return listing;
    },

    async toggleFavorite(userId: string, listingId: string): Promise<{ favorited: boolean }> {
      const listing = await listingsRepository.findById(listingId);
      if (!listing) {
        throw new NotFoundError("Listing not found");
      }

      const existing = await favoritesRepository.find(userId, listingId);
      if (existing) {
        await favoritesRepository.delete(userId, listingId);
        return { favorited: false };
      }

      await favoritesRepository.create(userId, listingId);
      return { favorited: true };
    },
  };
}
