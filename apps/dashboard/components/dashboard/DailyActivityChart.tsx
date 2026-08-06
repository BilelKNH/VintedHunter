"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { DailyActivityPoint } from "@vinted-hunter/shared";

function ActivityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DailyActivityPoint }[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-md border border-border-default bg-bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-text-primary">{point.date}</p>
      <p className="text-text-secondary">{point.count} analyzed</p>
      {point.count > 0 && (
        <p className="text-text-secondary">Avg score {Math.round(point.averageScore)}</p>
      )}
    </div>
  );
}

export function DailyActivityChart({ data }: { data: DailyActivityPoint[] }) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
        Analysis activity (30d)
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
            <Tooltip content={<ActivityTooltip />} />
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
