"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { Search } from "@vinted-hunter/shared";

interface DayBucket {
  date: string;
  count: number;
}

function buildDayBuckets(searches: Search[]): DayBucket[] {
  const days: DayBucket[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    days.push({ date: date.toISOString().slice(0, 10), count: 0 });
  }

  const byDay = new Map(days.map((day) => [day.date, day]));
  for (const search of searches) {
    const bucket = byDay.get(search.createdAt.slice(0, 10));
    if (bucket) bucket.count += 1;
  }

  return days;
}

export function SearchActivityChart({ searches }: { searches: Search[] }) {
  const data = useMemo(() => buildDayBuckets(searches), [searches]);

  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
        Search activity (30d)
      </span>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5793a" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f5793a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <Tooltip
              contentStyle={{
                background: "#1b1b1f",
                border: "1px solid #232328",
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: "#9b9ba3" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#f5793a"
              fill="url(#activityFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
