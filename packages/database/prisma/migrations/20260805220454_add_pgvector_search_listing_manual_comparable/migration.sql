-- CreateExtension
-- Explicit SCHEMA public: extensions are per-database, not per-schema, so this only ever
-- installs once — but apps/worker's test suite applies this same migration history against a
-- second schema ("test", see DATABASE_URL_TEST) whose connection's search_path doesn't include
-- public. Without the explicit schema here (and public.vector below), CREATE EXTENSION would
-- silently no-op against the already-installed instance and the unqualified `vector(1536)` type
-- reference would then fail to resolve on that connection.
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "embedding" public.vector(1536);

-- CreateTable
CREATE TABLE "search_listings" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delistedAt" TIMESTAMP(3),

    CONSTRAINT "search_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_comparables" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manual_comparables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_listings_searchId_idx" ON "search_listings"("searchId");

-- CreateIndex
CREATE UNIQUE INDEX "search_listings_searchId_listingId_key" ON "search_listings"("searchId", "listingId");

-- CreateIndex
CREATE INDEX "manual_comparables_listingId_idx" ON "manual_comparables"("listingId");

-- AddForeignKey
ALTER TABLE "search_listings" ADD CONSTRAINT "search_listings_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_listings" ADD CONSTRAINT "search_listings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_comparables" ADD CONSTRAINT "manual_comparables_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_comparables" ADD CONSTRAINT "manual_comparables_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
