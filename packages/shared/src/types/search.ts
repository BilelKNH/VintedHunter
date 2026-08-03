// Mirrors the Prisma Search model as shaped over the wire (see types/listing.ts for the
// date-as-ISO-string note).
export interface Search {
  id: string;
  userId: string;
  name: string;
  brands: string[];
  categories: string[];
  sizes: string[];
  keywords: string[];
  excludedKeywords: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minimumScore: number;
  frequency: number;
  enabled: boolean;
  createdAt: string;
}
