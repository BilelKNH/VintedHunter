import type { PrismaClient, Search } from "@vinted-hunter/database";

export interface CreateSearchInput {
  userId: string;
  name: string;
  brands: string[];
  categories: string[];
  sizes: string[];
  keywords: string[];
  excludedKeywords: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  minimumScore?: number;
  frequency: number;
  enabled?: boolean;
}

export type UpdateSearchInput = Partial<Omit<CreateSearchInput, "userId">>;

export interface SearchesRepository {
  findById(id: string): Promise<Search | null>;
  findAllByUserId(userId: string): Promise<Search[]>;
  create(data: CreateSearchInput): Promise<Search>;
  update(id: string, data: UpdateSearchInput): Promise<Search>;
  delete(id: string): Promise<void>;
}

export function createSearchesRepository(prisma: PrismaClient): SearchesRepository {
  return {
    findById: (id) => prisma.search.findUnique({ where: { id } }),
    findAllByUserId: (userId) =>
      prisma.search.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    create: (data) => prisma.search.create({ data }),
    update: (id, data) => prisma.search.update({ where: { id }, data }),
    delete: async (id) => {
      await prisma.search.delete({ where: { id } });
    },
  };
}
