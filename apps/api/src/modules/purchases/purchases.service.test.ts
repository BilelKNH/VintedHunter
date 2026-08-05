import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing } from "@vinted-hunter/database";
import { createPurchasesService } from "./purchases.service.js";
import type { PurchasesRepository, PurchaseWithListing } from "./purchases.repository.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors.js";

function fakeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    externalId: "ext-1",
    source: "VINTED",
    title: "Nike Tech Fleece Hoodie",
    description: null,
    brand: "Nike",
    category: null,
    size: null,
    condition: null,
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

function fakePurchase(overrides: Partial<PurchaseWithListing> = {}): PurchaseWithListing {
  return {
    id: "purchase-1",
    userId: "user-1",
    listingId: "listing-1",
    purchasePrice: 35,
    sellingPrice: null,
    profit: null,
    status: "PENDING",
    createdAt: new Date(),
    listing: fakeListing(),
    ...overrides,
  };
}

describe("purchases.service", () => {
  let purchasesRepository: PurchasesRepository;
  let service: ReturnType<typeof createPurchasesService>;

  beforeEach(() => {
    purchasesRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findActiveByListingId: vi.fn(),
      findDisplayableByListingId: vi.fn(),
      update: vi.fn(),
      findAllByUserId: vi.fn(),
      countByUserId: vi.fn(),
      getStatsByUserId: vi.fn(),
    };
    service = createPurchasesService({ purchasesRepository });
  });

  describe("recordPurchase", () => {
    it("creates a purchase when no active purchase exists for the listing", async () => {
      vi.mocked(purchasesRepository.findActiveByListingId).mockResolvedValue(null);
      const created = fakePurchase();
      vi.mocked(purchasesRepository.create).mockResolvedValue(created);

      const result = await service.recordPurchase("user-1", "listing-1", 35);

      expect(purchasesRepository.create).toHaveBeenCalledWith({
        userId: "user-1",
        listingId: "listing-1",
        purchasePrice: 35,
      });
      expect(result).toEqual(created);
    });

    it("throws ConflictError when the listing already has an active purchase", async () => {
      vi.mocked(purchasesRepository.findActiveByListingId).mockResolvedValue(
        fakePurchase({ id: "existing" }),
      );

      await expect(service.recordPurchase("user-1", "listing-1", 35)).rejects.toThrow(
        ConflictError,
      );
      expect(purchasesRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("recordSale", () => {
    it("computes profit and marks the purchase sold", async () => {
      vi.mocked(purchasesRepository.findById).mockResolvedValue(fakePurchase({ purchasePrice: 35 }));
      const updated = fakePurchase({ status: "SOLD", sellingPrice: 60, profit: 25 });
      vi.mocked(purchasesRepository.update).mockResolvedValue(updated);

      const result = await service.recordSale("user-1", "purchase-1", 60);

      expect(purchasesRepository.update).toHaveBeenCalledWith("purchase-1", {
        sellingPrice: 60,
        profit: 25,
        status: "SOLD",
      });
      expect(result).toEqual(updated);
    });

    it("throws NotFoundError when the purchase does not exist", async () => {
      vi.mocked(purchasesRepository.findById).mockResolvedValue(null);

      await expect(service.recordSale("user-1", "missing", 60)).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when the purchase belongs to another user", async () => {
      vi.mocked(purchasesRepository.findById).mockResolvedValue(
        fakePurchase({ userId: "other-user" }),
      );

      await expect(service.recordSale("user-1", "purchase-1", 60)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("throws ConflictError when the purchase is not PENDING", async () => {
      vi.mocked(purchasesRepository.findById).mockResolvedValue(
        fakePurchase({ status: "CANCELLED" }),
      );

      await expect(service.recordSale("user-1", "purchase-1", 60)).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("cancelPurchase", () => {
    it("marks a PENDING purchase as CANCELLED", async () => {
      vi.mocked(purchasesRepository.findById).mockResolvedValue(fakePurchase());
      const cancelled = fakePurchase({ status: "CANCELLED" });
      vi.mocked(purchasesRepository.update).mockResolvedValue(cancelled);

      const result = await service.cancelPurchase("user-1", "purchase-1");

      expect(purchasesRepository.update).toHaveBeenCalledWith("purchase-1", {
        status: "CANCELLED",
      });
      expect(result).toEqual(cancelled);
    });

    it("throws ConflictError when the purchase is already SOLD", async () => {
      vi.mocked(purchasesRepository.findById).mockResolvedValue(
        fakePurchase({ status: "SOLD" }),
      );

      await expect(service.cancelPurchase("user-1", "purchase-1")).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("listByUser", () => {
    it("computes skip/take from page and limit and returns pagination meta", async () => {
      const items = [fakePurchase()];
      vi.mocked(purchasesRepository.findAllByUserId).mockResolvedValue(items);
      vi.mocked(purchasesRepository.countByUserId).mockResolvedValue(1);

      const result = await service.listByUser("user-1", 2, 10);

      expect(purchasesRepository.findAllByUserId).toHaveBeenCalledWith("user-1", {
        skip: 10,
        take: 10,
      });
      expect(result).toEqual({ items, total: 1, page: 2, limit: 10 });
    });
  });
});
