import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManualComparable } from "@vinted-hunter/database";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";
import { createManualComparablesService } from "./manual-comparables.service.js";
import type { ManualComparablesRepository } from "./manual-comparables.repository.js";

function fakeManualComparable(overrides: Partial<ManualComparable> = {}): ManualComparable {
  return {
    id: "comp-1",
    userId: "user-1",
    listingId: "listing-1",
    price: 74,
    currency: "EUR",
    sourceName: "eBay",
    sourceUrl: null,
    note: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("manual-comparables.service", () => {
  let manualComparablesRepository: ManualComparablesRepository;
  let service: ReturnType<typeof createManualComparablesService>;

  beforeEach(() => {
    manualComparablesRepository = {
      findByListingId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };
    service = createManualComparablesService({ manualComparablesRepository });
  });

  describe("listForListing", () => {
    it("passes through to the repository", async () => {
      const items = [fakeManualComparable()];
      vi.mocked(manualComparablesRepository.findByListingId).mockResolvedValue(items);

      await expect(service.listForListing("listing-1")).resolves.toEqual(items);
      expect(manualComparablesRepository.findByListingId).toHaveBeenCalledWith("listing-1");
    });
  });

  describe("delete", () => {
    it("throws NotFoundError when the comparable does not exist", async () => {
      vi.mocked(manualComparablesRepository.findById).mockResolvedValue(null);

      await expect(service.delete("user-1", "missing")).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when the comparable belongs to another user", async () => {
      vi.mocked(manualComparablesRepository.findById).mockResolvedValue(
        fakeManualComparable({ userId: "someone-else" }),
      );

      await expect(service.delete("user-1", "comp-1")).rejects.toThrow(ForbiddenError);
      expect(manualComparablesRepository.delete).not.toHaveBeenCalled();
    });

    it("deletes the comparable when owned by the requesting user", async () => {
      vi.mocked(manualComparablesRepository.findById).mockResolvedValue(
        fakeManualComparable({ userId: "user-1" }),
      );

      await service.delete("user-1", "comp-1");

      expect(manualComparablesRepository.delete).toHaveBeenCalledWith("comp-1");
    });
  });
});
