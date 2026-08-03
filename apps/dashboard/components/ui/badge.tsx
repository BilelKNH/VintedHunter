import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-border-default bg-bg-elevated text-text-secondary",
        accent: "border-accent-primary/40 bg-accent-primary/10 text-accent-primary",
        success: "border-accent-secondary/40 bg-accent-secondary/10 text-accent-secondary",
        danger: "border-danger/40 bg-danger/10 text-danger",
        outline: "border-border-default text-text-secondary",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
