import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Search } from "@vinted-hunter/database";
import { createSearchesService } from "./searches.service.js";
import type { SearchesRepository } from "./searches.repository.js";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";

function fakeSearch(overrides: Partial<Search> = {}): Search {
  return {
    id: "search-1",
    userId: "user-1",
    name: "Nike Tech Fleece",
    brands: ["Nike"],
    categories: ["Hoodie"],
    sizes: ["L"],
    keywords: [],
    excludedKeywords: [],
    minPrice: null,
    maxPrice: 50,
    minimumScore: 70,
    targetRoi: 30,
    frequency: 15,
    enabled: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("searches.service", () => {
  let searchesRepository: SearchesRepository;
  let service: ReturnType<typeof createSearchesService>;

  beforeEach(() => {
    searchesRepository = {
      findById: vi.fn(),
      findAllByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = createSearchesService({ searchesRepository });
  });

  it("creates a search scoped to the given user", async () => {
    const created = fakeSearch();
    vi.mocked(searchesRepository.create).mockResolvedValue(created);

    const result = await service.create("user-1", {
      name: "Nike Tech Fleece",
      brands: ["Nike"],
      categories: ["Hoodie"],
      sizes: ["L"],
      keywords: [],
      excludedKeywords: [],
      maxPrice: 50,
      frequency: 15,
    });

    expect(searchesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", name: "Nike Tech Fleece" }),
    );
    expect(result).toEqual(created);
  });

  it("lists searches for the given user", async () => {
    vi.mocked(searchesRepository.findAllByUserId).mockResolvedValue([fakeSearch()]);

    const result = await service.listByUser("user-1");

    expect(searchesRepository.findAllByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toHaveLength(1);
  });

  describe("update", () => {
    it("updates the search when owned by the user", async () => {
      const existing = fakeSearch();
      vi.mocked(searchesRepository.findById).mockResolvedValue(existing);
      const updated = fakeSearch({ name: "Renamed" });
      vi.mocked(searchesRepository.update).mockResolvedValue(updated);

      const result = await service.update("user-1", "search-1", { name: "Renamed" });

      expect(searchesRepository.update).toHaveBeenCalledWith("search-1", { name: "Renamed" });
      expect(result).toEqual(updated);
    });

    it("throws NotFoundError when the search does not exist", async () => {
      vi.mocked(searchesRepository.findById).mockResolvedValue(null);

      await expect(service.update("user-1", "missing", {})).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when the search belongs to another user", async () => {
      vi.mocked(searchesRepository.findById).mockResolvedValue(fakeSearch({ userId: "other" }));

      await expect(service.update("user-1", "search-1", {})).rejects.toThrow(ForbiddenError);
      expect(searchesRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deletes the search when owned by the user", async () => {
      vi.mocked(searchesRepository.findById).mockResolvedValue(fakeSearch());

      await service.delete("user-1", "search-1");

      expect(searchesRepository.delete).toHaveBeenCalledWith("search-1");
    });

    it("throws ForbiddenError when the search belongs to another user", async () => {
      vi.mocked(searchesRepository.findById).mockResolvedValue(fakeSearch({ userId: "other" }));

      await expect(service.delete("user-1", "search-1")).rejects.toThrow(ForbiddenError);
      expect(searchesRepository.delete).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when the search does not exist", async () => {
      vi.mocked(searchesRepository.findById).mockResolvedValue(null);

      await expect(service.delete("user-1", "missing")).rejects.toThrow(NotFoundError);
    });
  });
});
