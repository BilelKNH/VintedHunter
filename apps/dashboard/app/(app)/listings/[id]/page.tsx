"use client";

import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/common/ErrorState";
import { ListingGallery } from "@/components/listings/ListingGallery";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { AnalysisPendingBadge } from "@/components/listings/AnalysisPendingBadge";
import { useListing } from "@/hooks/useListings";
import { formatPrice, formatRelativeDate } from "@/utils/format";

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: listing, isLoading, isError, refetch } = useListing(params.id);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !listing) {
    return <ErrorState message="Listing not found." onRetry={() => void refetch()} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ListingGallery images={listing.images} alt={listing.title} />

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-display text-xl font-semibold text-text-primary">
            {listing.title}
          </h1>
          <FavoriteButton listingId={listing.id} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          {listing.brand ? <Badge variant="accent">{listing.brand}</Badge> : null}
          {listing.category ? <Badge>{listing.category}</Badge> : null}
          {listing.size ? <span>Size {listing.size}</span> : null}
          {listing.condition ? <span>&middot; {listing.condition}</span> : null}
          <Badge variant="outline">{listing.source}</Badge>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="font-numeric text-3xl font-semibold text-text-primary">
            {formatPrice(listing.price, listing.currency)}
          </span>
          <span className="text-xs text-text-tertiary">
            Synced {formatRelativeDate(listing.publishedAt ?? listing.createdAt)}
          </span>
        </div>

        <AnalysisPendingBadge />

        {listing.description ? (
          <p className="whitespace-pre-line text-sm text-text-secondary">
            {listing.description}
          </p>
        ) : null}

        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent-primary hover:text-accent-primary"
        >
          View on {listing.source}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
