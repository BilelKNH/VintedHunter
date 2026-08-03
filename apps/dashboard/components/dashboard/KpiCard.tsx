import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

export interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  className?: string;
}

export function KpiCard({ label, value, icon: Icon, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-3 rounded-lg border border-border-default bg-bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {label}
        </span>
        <Icon className="h-4 w-4 text-accent-primary" />
      </div>
      <span className="font-numeric text-2xl font-semibold text-text-primary">{value}</span>
    </div>
  );
}
