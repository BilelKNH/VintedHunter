import type { PrismaClient } from '@vinted-hunter/database';

export interface EmbeddingsRepository {
  updateEmbedding(listingId: string, embedding: number[]): Promise<void>;
}

// Listing.embedding is declared Unsupported("vector(1536)") in schema.prisma — Prisma Client
// can't hydrate that type, so every read/write goes through raw SQL. pgvector accepts its text
// input format ("[0.1,0.2,...]") directly; Prisma's tagged template still binds this as a plain
// string parameter, so the embedding values are never interpolated into the SQL text itself.
// Cast is schema-qualified (public.vector) because apps/worker's test suite runs the same code
// against a DATABASE_URL_TEST-scoped "test" schema whose connection search_path excludes public
// — the extension only ever installs once per database (in public), so an unqualified `::vector`
// fails to resolve on that connection even though the type genuinely exists in the database.
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export function createEmbeddingsRepository(prisma: PrismaClient): EmbeddingsRepository {
  return {
    async updateEmbedding(listingId, embedding) {
      await prisma.$executeRaw`
        UPDATE "listings" SET "embedding" = ${toVectorLiteral(embedding)}::public.vector
        WHERE "id" = ${listingId}
      `;
    },
  };
}
