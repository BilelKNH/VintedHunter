import type { PrismaClient } from '@vinted-hunter/database';

export interface Comparable {
  price: number;
}

export interface ComparableListingsRepository {
  findComparables(params: {
    excludeListingId: string;
    brand: string | null;
    category: string | null;
    limit?: number;
    // Similarity engine (packages/similarity-engine) — when present, comparables are ranked by
    // embedding similarity instead of exact brand/category match. Absent whenever
    // OPENAI_API_KEY isn't configured, the embedding call failed, or the listing hasn't been
    // analyzed yet — in which case behavior is byte-identical to before this field existed.
    embedding?: number[] | null;
  }): Promise<Comparable[]>;
}

const DEFAULT_LIMIT = 20;
// Minimum computeSimilarityScore (packages/similarity-engine) for a listing to count as a
// comparable — below this, embeddings alone don't reliably distinguish e.g. "Nike Tech Fleece"
// from "Nike Air" and a false match would corrupt estimateMarketPrice's average.
const SIMILARITY_THRESHOLD = 0.75;
// pgvector's <=> operator (vector_cosine_ops) returns cosine *distance*, i.e. 1 - similarity.
const MAX_COSINE_DISTANCE = 1 - SIMILARITY_THRESHOLD;

// pgvector accepts its text input format ("[0.1,0.2,...]") directly — see
// embeddings.repository.ts for why this is safe to interpolate as a plain string parameter, and
// for why the ::vector casts below are schema-qualified (public.vector). The <=> cosine-distance
// operator is schema-scoped the same way (Postgres resolves operators via search_path, same as
// types) — OPERATOR(public.<=>) is the schema-qualified operator-call syntax, since `<=>` itself
// can't take a schema prefix the way a function or type name can.
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

// §24/§25: originally matched by brand+category against Postgres only ("vector similarity is
// Phase 6, §59-60" — this is that phase). The brand/category path below is kept as the fallback
// for listings without an embedding yet, so existing behavior never regresses.
export function createComparableListingsRepository(
  prisma: PrismaClient,
): ComparableListingsRepository {
  return {
    async findComparables({ excludeListingId, brand, category, limit = DEFAULT_LIMIT, embedding }) {
      if (embedding && embedding.length > 0) {
        const vectorLiteral = toVectorLiteral(embedding);
        return prisma.$queryRaw<Comparable[]>`
          SELECT "price" FROM "listings"
          WHERE "id" != ${excludeListingId}
            AND "embedding" IS NOT NULL
            AND ("embedding" OPERATOR(public.<=>) ${vectorLiteral}::public.vector) < ${MAX_COSINE_DISTANCE}
          ORDER BY "embedding" OPERATOR(public.<=>) ${vectorLiteral}::public.vector
          LIMIT ${limit}
        `;
      }

      if (!brand && !category) {
        return [];
      }
      return prisma.listing.findMany({
        where: {
          id: { not: excludeListingId },
          ...(brand ? { brand: { equals: brand, mode: 'insensitive' } } : {}),
          ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { price: true },
      });
    },
  };
}
