"use client";

import { CalendarClock, Heart, PiggyBank, ShoppingBag, Target, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SearchActivityChart } from "@/components/dashboard/SearchActivityChart";
import { BrandDistributionChart } from "@/components/dashboard/BrandDistributionChart";
import { IntelligencePreviewCard } from "@/components/dashboard/IntelligencePreviewCard";
import { useSearches } from "@/hooks/useSearches";
import { useListings } from "@/hooks/useListings";
import { useFavoriteListings } from "@/hooks/useFavorites";
import { usePurchaseStats } from "@/hooks/usePurchases";
import { formatPrice, formatRelativeDate } from "@/utils/format";

export default function DashboardPage() {
  const { data: searches, isLoading: searchesLoading } = useSearches();
  const { data: listingsPage, isLoading: listingsLoading } = useListings(1, 100);
  // Same (page, limit) as the hydration call in (app)/layout.tsx — react-query dedupes this
  // into a single shared query rather than firing a second request.
  const { data: favoritesPage } = useFavoriteListings(1, 100);
  const { data: purchaseStats, isLoading: purchaseStatsLoading } = usePurchaseStats();

  const isLoading = searchesLoading || listingsLoading;
  const enabledCount = searches?.filter((search) => search.enabled).length ?? 0;
  const totalSearches = searches?.length ?? 0;
  const totalListings = listingsPage?.meta.total ?? 0;
  const newestListing = listingsPage?.items[0];
  const favoritedCount = favoritesPage?.meta.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">Your resale-hunting console, at a glance.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Searches watching"
            value={`${enabledCount} / ${totalSearches}`}
            icon={Target}
          />
          <KpiCard label="Listings in catalog" value={String(totalListings)} icon={ShoppingBag} />
          <KpiCard
            label="Newest sync"
            value={newestListing ? formatRelativeDate(newestListing.createdAt) : "—"}
            icon={CalendarClock}
          />
          <KpiCard label="Favorited" value={String(favoritedCount)} icon={Heart} />
        </div>
      )}

      {purchaseStatsLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : purchaseStats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Realized profit"
            value={formatPrice(purchaseStats.totalRealizedProfit, "EUR")}
            icon={PiggyBank}
          />
          <KpiCard
            label="Avg realized ROI"
            value={
              purchaseStats.averageRealizedRoi != null
                ? `${purchaseStats.averageRealizedRoi >= 0 ? "+" : ""}${Math.round(purchaseStats.averageRealizedRoi)}%`
                : "—"
            }
            icon={TrendingUp}
          />
          <KpiCard label="Items flipped" value={String(purchaseStats.totalSold)} icon={ShoppingBag} />
          <KpiCard
            label="Capital deployed"
            value={formatPrice(purchaseStats.totalInvested, "EUR")}
            icon={Target}
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <SearchActivityChart searches={searches ?? []} />
        <div className="sm:col-span-2">
          <BrandDistributionChart listings={listingsPage?.items ?? []} />
        </div>
        <div className="sm:col-span-3">
          <IntelligencePreviewCard />
        </div>
      </div>
    </div>
  );
}
