import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors.js";
import type { PurchasesRepository, PurchaseWithListing } from "./purchases.repository.js";

export interface PurchasesServiceDeps {
  purchasesRepository: PurchasesRepository;
}

export interface PurchasesPage {
  items: PurchaseWithListing[];
  total: number;
  page: number;
  limit: number;
}

async function assertOwnership(
  purchasesRepository: PurchasesRepository,
  userId: string,
  purchaseId: string,
): Promise<PurchaseWithListing> {
  const existing = await purchasesRepository.findById(purchaseId);
  if (!existing) {
    throw new NotFoundError("Purchase not found");
  }
  if (existing.userId !== userId) {
    throw new ForbiddenError("This purchase belongs to another user");
  }
  return existing;
}

export function createPurchasesService({ purchasesRepository }: PurchasesServiceDeps) {
  return {
    async recordPurchase(
      userId: string,
      listingId: string,
      purchasePrice: number,
    ): Promise<PurchaseWithListing> {
      const active = await purchasesRepository.findActiveByListingId(userId, listingId);
      if (active) {
        throw new ConflictError("This listing is already marked as purchased");
      }
      return purchasesRepository.create({ userId, listingId, purchasePrice });
    },

    async recordSale(
      userId: string,
      purchaseId: string,
      sellingPrice: number,
    ): Promise<PurchaseWithListing> {
      const purchase = await assertOwnership(purchasesRepository, userId, purchaseId);
      if (purchase.status !== "PENDING") {
        throw new ConflictError(
          `Cannot mark a ${purchase.status.toLowerCase()} purchase as sold`,
        );
      }
      const profit = sellingPrice - purchase.purchasePrice;
      return purchasesRepository.update(purchaseId, { sellingPrice, profit, status: "SOLD" });
    },

    async cancelPurchase(userId: string, purchaseId: string): Promise<PurchaseWithListing> {
      const purchase = await assertOwnership(purchasesRepository, userId, purchaseId);
      if (purchase.status !== "PENDING") {
        throw new ConflictError(`Cannot cancel a ${purchase.status.toLowerCase()} purchase`);
      }
      return purchasesRepository.update(purchaseId, { status: "CANCELLED" });
    },

    async listByUser(userId: string, page: number, limit: number): Promise<PurchasesPage> {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        purchasesRepository.findAllByUserId(userId, { skip, take: limit }),
        purchasesRepository.countByUserId(userId),
      ]);
      return { items, total, page, limit };
    },

    findDisplayableForListing(userId: string, listingId: string) {
      return purchasesRepository.findDisplayableByListingId(userId, listingId);
    },

    getStats(userId: string) {
      return purchasesRepository.getStatsByUserId(userId);
    },
  };
}
