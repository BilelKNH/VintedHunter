import type { Search } from "@vinted-hunter/database";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";
import type { CreateSearchInput, SearchesRepository, UpdateSearchInput } from "./searches.repository.js";

export interface SearchesServiceDeps {
  searchesRepository: SearchesRepository;
}

async function assertOwnership(
  searchesRepository: SearchesRepository,
  userId: string,
  searchId: string,
): Promise<Search> {
  const existing = await searchesRepository.findById(searchId);
  if (!existing) {
    throw new NotFoundError("Search not found");
  }
  if (existing.userId !== userId) {
    throw new ForbiddenError("This search belongs to another user");
  }
  return existing;
}

export function createSearchesService({ searchesRepository }: SearchesServiceDeps) {
  return {
    create(userId: string, input: Omit<CreateSearchInput, "userId">): Promise<Search> {
      return searchesRepository.create({ ...input, userId });
    },

    listByUser(userId: string): Promise<Search[]> {
      return searchesRepository.findAllByUserId(userId);
    },

    async update(userId: string, searchId: string, patch: UpdateSearchInput): Promise<Search> {
      await assertOwnership(searchesRepository, userId, searchId);
      return searchesRepository.update(searchId, patch);
    },

    async delete(userId: string, searchId: string): Promise<void> {
      await assertOwnership(searchesRepository, userId, searchId);
      await searchesRepository.delete(searchId);
    },
  };
}
