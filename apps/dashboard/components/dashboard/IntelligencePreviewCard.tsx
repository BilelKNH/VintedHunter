import { Sparkles } from "lucide-react";

export function IntelligencePreviewCard() {
  return (
    <div className="flex flex-col items-start justify-center gap-2 rounded-lg border border-border-default bg-bg-surface/50 p-6">
      <Sparkles className="h-5 w-5 text-accent-secondary" />
      <p className="font-display text-sm font-medium text-text-primary">Intelligence engine</p>
      <p className="text-xs text-text-secondary">
        Every new listing is scored for opportunity, ROI, and a recommended max buy price, with
        Discord/Telegram alerts for the best matches.
      </p>
    </div>
  );
}
