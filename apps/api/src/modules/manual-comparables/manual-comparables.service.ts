import type { ManualComparable } from "@vinted-hunter/database";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";
import type {
  CreateManualComparableData,
  ManualComparablesRepository,
} from "./manual-comparables.repository.js";

export interface ManualComparablesServiceDeps {
  manualComparablesRepository: ManualComparablesRepository;
}

export function createManualComparablesService({
  manualComparablesRepository,
}: ManualComparablesServiceDeps) {
  return {
    listForListing(listingId: string): Promise<ManualComparable[]> {
      return manualComparablesRepository.findByListingId(listingId);
    },

    create(data: CreateManualComparableData): Promise<ManualComparable> {
      return manualComparablesRepository.create(data);
    },

    async delete(userId: string, id: string): Promise<void> {
      const existing = await manualComparablesRepository.findById(id);
      if (!existing) {
        throw new NotFoundError("Manual comparable not found");
      }
      if (existing.userId !== userId) {
        throw new ForbiddenError("This manual comparable belongs to another user");
      }
      await manualComparablesRepository.delete(id);
    },
  };
}
