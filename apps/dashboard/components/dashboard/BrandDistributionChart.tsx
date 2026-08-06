"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BrandCount } from "@vinted-hunter/shared";

export function BrandDistributionChart({ data }: { data: BrandCount[] }) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
        Catalog composition by brand
      </span>
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
