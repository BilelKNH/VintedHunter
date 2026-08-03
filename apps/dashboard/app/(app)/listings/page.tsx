"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { ListingGrid } from "@/components/listings/ListingGrid";
import {
  DEFAULT_LISTING_FILTERS,
  ListingFilters,
  type ListingFiltersValue,
} from "@/components/listings/ListingFilters";
import { useListings } from "@/hooks/useListings";

const PAGE_SIZE = 20;

export default function ListingsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ListingFiltersValue>(DEFAULT_LISTING_FILTERS);
  const { data, isLoading, isError, refetch } = useListings(page, PAGE_SIZE);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter((listing) => {
      if (filters.brand !== "all" && listing.brand !== filters.brand) return false;
      if (filters.category !== "all" && listing.category !== filters.category) return false;
      if (filters.minPrice && listing.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && listing.price > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [data, filters]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Listings</h1>
        <p className="text-sm text-text-secondary">Browse the synced catalog.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : data && data.items.length > 0 ? (
        <>
          <ListingFilters listings={data.items} value={filters} onChange={setFilters} />
          {filteredItems.length > 0 ? (
            <ListingGrid listings={filteredItems} />
          ) : (
            <EmptyState
              title="No listings match these filters"
              description="Try widening your brand, category, or price filters."
            />
          )}
          <Pagination
            page={data.meta.page}
            limit={data.meta.limit}
            total={data.meta.total}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No listings yet"
          description="Listings will appear here once the crawler starts syncing in Phase 4."
        />
      )}
    </div>
  );
}
