// Mirrors the fields the Search model actually has (packages/database/prisma/schema.prisma) —
// SPECIFICATION.md §11.5 also lists `condition` and `country`, but those aren't columns on the
// real Search model (Phase 2 never added them), so they're intentionally left out here rather
// than inventing data the API/dashboard don't collect.
export interface SearchConfiguration {
  id: string;
  name: string;
  brands: string[];
  categories: string[];
  sizes: string[];
  keywords: string[];
  excludedKeywords: string[];
  minPrice: number | null;
  maxPrice: number | null;
}

export interface CrawledSeller {
  externalId: string;
  username: string;
  rating: number | null;
  reviews: number | null;
}

// The shape handed to apps/worker for persistence — one step past ParsedListing (see
// parser/listing-parser.ts), enriched with a best-effort category guess and a content hash
// for change detection (see normalizer/normalize-listing.ts).
export interface CrawledListing {
  externalId: string;
  source: 'VINTED';
  title: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
  condition: string | null;
  price: number;
  currency: string;
  url: string;
  images: string[];
  seller: CrawledSeller | null;
  publishedAt: string | null;
  contentHash: string;
}

export interface CrawlerConfig {
  vintedBaseUrl: string;
  maxWorkers: number;
  requestDelayMinMs: number;
  requestDelayMaxMs: number;
  cacheDurationMs: number;
}
