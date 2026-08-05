-- Hand-written: pgvector's HNSW index type + vector_cosine_ops operator class aren't
-- representable in schema.prisma's @@index DSL (Listing.embedding is Unsupported()), so this
-- can't be generated from a schema diff — see packages/similarity-engine for what queries it.
CREATE INDEX "listings_embedding_idx" ON "listings" USING hnsw ("embedding" public.vector_cosine_ops);
