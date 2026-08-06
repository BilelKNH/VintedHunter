"use client";

import type { CategoryRecommendationCount, ListingRecommendation } from "@vinted-hunter/shared";

const BANDS: ListingRecommendation[] = ["IGNORE", "WATCH", "GOOD_OPPORTUNITY", "STRONG_BUY"];

const BAND_LABEL: Record<ListingRecommendation, string> = {
  IGNORE: "Ignore",
  WATCH: "Watch",
  GOOD_OPPORTUNITY: "Good opp.",
  STRONG_BUY: "Strong buy",
};

// Mirrors AnalysisScoreBadge.tsx's VARIANT → accent color mapping (outline/default/accent/
// success), so a STRONG_BUY-heavy cell reads with the same teal a STRONG_BUY badge already
// uses elsewhere, rather than inventing a new heatmap palette.
const BAND_COLOR: Record<ListingRecommendation, string> = {
  IGNORE: "#232328",
  WATCH: "#3a3a42",
  GOOD_OPPORTUNITY: "#f5793a",
  STRONG_BUY: "#2dd4bf",
};

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CategoryHeatmap({ data }: { data: CategoryRecommendationCount[] }) {
  const categories = Array.from(new Set(data.map((row) => row.category))).sort();
  const maxCount = Math.max(1, ...data.map((row) => row.count));

  const countFor = (category: string, recommendation: ListingRecommendation) =>
    data.find((row) => row.category === category && row.recommendation === recommendation)
      ?.count ?? 0;

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-border-default bg-bg-surface p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
        Category × recommendation
      </span>
      {categories.length === 0 ? (
        <p className="text-xs text-text-tertiary">Not enough analyzed listings yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="text-left font-normal text-text-tertiary" />
                {BANDS.map((band) => (
                  <th key={band} className="px-1 pb-1 text-center font-normal text-text-tertiary">
                    {BAND_LABEL[band]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category}>
                  <td className="pr-2 text-text-secondary">{category}</td>
                  {BANDS.map((band) => {
                    const count = countFor(category, band);
                    const intensity = count > 0 ? 0.15 + (count / maxCount) * 0.65 : 0;
                    return (
                      <td key={band} className="p-0">
                        <div
                          className="flex h-9 w-full min-w-10 items-center justify-center rounded-md text-text-primary"
                          style={{ backgroundColor: hexToRgba(BAND_COLOR[band], intensity) }}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
