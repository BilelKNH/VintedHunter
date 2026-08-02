import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Favorite, Listing } from "@vinted-hunter/database";
import { createListingsService } from "./listings.service.js";
import type { ListingsRepository } from "./listings.repository.js";
import type { FavoritesRepository } from "./favorites.repository.js";
import { NotFoundError } from "../../utils/errors.js";

function fakeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    externalId: "ext-1",
    source: "VINTED",
    title: "Nike Tech Fleece Hoodie",
    description: null,
    brand: "Nike",
    category: "Hoodie",
    size: "L",
    condition: "Excellent",
    price: 35,
    currency: "EUR",
    url: "https://vinted.example/items/1",
    images: [],
    sellerId: null,
    publishedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("listings.service", () => {
  let listingsRepository: ListingsRepository;
  let favoritesRepository: FavoritesRepository;
  let service: ReturnType<typeof createListingsService>;

  beforeEach(() => {
    listingsRepository = {
      findMany: vi.fn(),
      count: vi.fn(),
      findById: vi.fn(),
    };
    favoritesRepository = {
      find: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };
    service = createListingsService({ listingsRepository, favoritesRepository });
  });

  describe("list", () => {
    it("computes skip/take from page and limit and returns pagination meta", async () => {
      const items = [fakeListing()];
      vi.mocked(listingsRepository.findMany).mockResolvedValue(items);
      vi.mocked(listingsRepository.count).mockResolvedValue(1);

      const result = await service.list(2, 10);

      expect(listingsRepository.findMany).toHaveBeenCalledWith({ skip: 10, take: 10 });
      expect(result).toEqual({ items, total: 1, page: 2, limit: 10 });
    });
  });

  describe("getById", () => {
    it("returns the listing when found", async () => {
      const listing = fakeListing();
      vi.mocked(listingsRepository.findById).mockResolvedValue(listing);

      await expect(service.getById("listing-1")).resolves.toEqual(listing);
    });

    it("throws NotFoundError when missing", async () => {
      vi.mocked(listingsRepository.findById).mockResolvedValue(null);

      await expect(service.getById("missing")).rejects.toThrow(NotFoundError);
    });
  });

  describe("toggleFavorite", () => {
    it("favorites the listing when not already favorited", async () => {
      vi.mocked(listingsRepository.findById).mockResolvedValue(fakeListing());
      vi.mocked(favoritesRepository.find).mockResolvedValue(null);

      const result = await service.toggleFavorite("user-1", "listing-1");

      expect(favoritesRepository.create).toHaveBeenCalledWith("user-1", "listing-1");
      expect(favoritesRepository.delete).not.toHaveBeenCalled();
      expect(result).toEqual({ favorited: true });
    });

    it("unfavorites the listing when already favorited", async () => {
      vi.mocked(listingsRepository.findById).mockResolvedValue(fakeListing());
      vi.mocked(favoritesRepository.find).mockResolvedValue({
        id: "fav-1",
        userId: "user-1",
        listingId: "listing-1",
        createdAt: new Date(),
      } satisfies Favorite);

      const result = await service.toggleFavorite("user-1", "listing-1");

      expect(favoritesRepository.delete).toHaveBeenCalledWith("user-1", "listing-1");
      expect(favoritesRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual({ favorited: false });
    });

    it("throws NotFoundError when the listing does not exist", async () => {
      vi.mocked(listingsRepository.findById).mockResolvedValue(null);

      await expect(service.toggleFavorite("user-1", "missing")).rejects.toThrow(NotFoundError);
    });
  });
});
