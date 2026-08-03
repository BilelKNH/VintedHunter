"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Listing } from "@vinted-hunter/shared";

function buildBrandCounts(listings: Listing[]): { brand: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const listing of listings) {
    const brand = listing.brand ?? "Unknown";
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function BrandDistributionChart({ listings }: { listings: Listing[] }) {
  const data = useMemo(() => buildBrandCounts(listings), [listings]);

  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          Catalog composition by brand
        </span>
        <span className="text-[10px] uppercase tracking-wide text-text-tertiary">
          Based on latest {listings.length} synced listings
        </span>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="brand"
              width={90}
              tick={{ fill: "#9b9ba3", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1b1b1f",
                border: "1px solid #232328",
                borderRadius: 6,
                fontSize: 12,
              }}
              cursor={{ fill: "#232328" }}
            />
            <Bar dataKey="count" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
