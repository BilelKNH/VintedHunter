import { recommendationForScore } from "@vinted-hunter/analyzer";
import type { Listing as ListingResponse } from "@vinted-hunter/shared";
import { NotFoundError } from "../../utils/errors.js";
import type { FavoritesRepository } from "./favorites.repository.js";
import type { ListingsRepository, ListingWithAnalysis } from "./listings.repository.js";

export interface ListingsServiceDeps {
  listingsRepository: ListingsRepository;
  favoritesRepository: FavoritesRepository;
}

export interface ListingsPage {
  items: ListingResponse[];
  total: number;
  page: number;
  limit: number;
}

// analyze-listing (apps/worker) only stores `score` — `recommendation` is derived from it on
// read so the two can never drift out of sync (see packages/analyzer's compute-score.ts).
function toListingResponse(listing: ListingWithAnalysis): ListingResponse {
  return {
    ...listing,
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    createdAt: listing.createdAt.toISOString(),
    analysis: listing.analysis
      ? {
          score: listing.analysis.score,
          recommendation: recommendationForScore(listing.analysis.score),
        }
      : null,
  };
}

export function createListingsService({ listingsRepository, favoritesRepository }: ListingsServiceDeps) {
  return {
    async list(page: number, limit: number): Promise<ListingsPage> {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        listingsRepository.findMany({ skip, take: limit }),
        listingsRepository.count(),
      ]);
      return { items: items.map(toListingResponse), total, page, limit };
    },

    async getById(id: string): Promise<ListingResponse> {
      const listing = await listingsRepository.findById(id);
      if (!listing) {
        throw new NotFoundError("Listing not found");
      }
      return toListingResponse(listing);
    },

    async listFavorites(userId: string, page: number, limit: number): Promise<ListingsPage> {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        favoritesRepository.findAllByUserId(userId, { skip, take: limit }),
        favoritesRepository.countByUserId(userId),
      ]);
      return { items: items.map(toListingResponse), total, page, limit };
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
