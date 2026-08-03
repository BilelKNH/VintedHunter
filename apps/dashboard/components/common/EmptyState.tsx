import Link from "next/link";
import { Button } from "../ui/button";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: { href: string; label: string };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-default bg-bg-surface/50 py-16 text-center">
      <p className="font-display text-base font-medium text-text-primary">{title}</p>
      <p className="max-w-xs text-sm text-text-secondary">{description}</p>
      {action ? (
        <Button asChild size="sm" className="mt-2">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
