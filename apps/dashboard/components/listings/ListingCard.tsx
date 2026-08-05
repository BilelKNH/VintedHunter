import Link from "next/link";
import type { Listing } from "@vinted-hunter/shared";
import { Badge } from "../ui/badge";
import { FavoriteButton } from "./FavoriteButton";
import { AnalysisPendingBadge } from "./AnalysisPendingBadge";
import { AnalysisScoreBadge, recommendationCardAccent } from "./AnalysisScoreBadge";
import { formatPrice, formatRelativeDate } from "../../utils/format";
import { cn } from "../../utils/cn";

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.images[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border-default bg-bg-surface transition-all hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/5",
        recommendationCardAccent(listing.analysis?.recommendation),
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-bg-elevated">
        {image ? (
          // Listing images come from arbitrary external marketplaces — a plain <img> avoids
          // needing to pre-register every possible source domain with next/image.
          <img
            src={image}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-tertiary">
            No image
          </div>
        )}
        <div className="absolute right-2 top-2 rounded-full bg-bg-base/70 backdrop-blur-sm">
          <FavoriteButton listingId={listing.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-text-primary">{listing.title}</h3>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-secondary">
          {listing.brand ? <Badge>{listing.brand}</Badge> : null}
          {listing.size ? <span>Size {listing.size}</span> : null}
          {listing.condition ? <span>&middot; {listing.condition}</span> : null}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="font-numeric text-base font-semibold text-text-primary">
              {formatPrice(listing.price, listing.currency)}
            </span>
            {listing.analysis ? (
              <span className="text-xs text-text-tertiary">
                Max {formatPrice(listing.analysis.maxBuyPrice, listing.currency)}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-text-tertiary">
            {formatRelativeDate(listing.publishedAt)}
          </span>
        </div>
        {listing.analysis ? (
          <AnalysisScoreBadge analysis={listing.analysis} />
        ) : (
          <AnalysisPendingBadge />
        )}
      </div>
    </Link>
  );
}
