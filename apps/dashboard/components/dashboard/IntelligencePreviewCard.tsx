import { Sparkles } from "lucide-react";

export function IntelligencePreviewCard() {
  return (
    <div className="flex flex-col items-start justify-center gap-2 rounded-lg border border-dashed border-border-default bg-bg-surface/50 p-6">
      <Sparkles className="h-5 w-5 text-accent-secondary" />
      <p className="font-display text-sm font-medium text-text-primary">Intelligence engine</p>
      <p className="text-xs text-text-secondary">
        Opportunity scoring, ROI estimation, and notifications ship in Phase 5.
      </p>
    </div>
  );
}
