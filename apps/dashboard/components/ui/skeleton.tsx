import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-bg-surface",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-scan-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}
