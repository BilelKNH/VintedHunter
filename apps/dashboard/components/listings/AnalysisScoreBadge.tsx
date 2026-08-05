import { Sparkles } from "lucide-react";
import type { ListingAnalysisSummary, ListingRecommendation } from "@vinted-hunter/shared";
import { Badge, type BadgeProps } from "../ui/badge";

const LABEL: Record<ListingRecommendation, string> = {
  IGNORE: "Ignore",
  WATCH: "Watch",
  GOOD_OPPORTUNITY: "Good opportunity",
  STRONG_BUY: "Strong buy",
};

const VARIANT: Record<ListingRecommendation, BadgeProps["variant"]> = {
  IGNORE: "outline",
  WATCH: "default",
  GOOD_OPPORTUNITY: "accent",
  STRONG_BUY: "success",
};

export function AnalysisScoreBadge({ analysis }: { analysis: ListingAnalysisSummary }) {
  return (
    <Badge variant={VARIANT[analysis.recommendation]} className="gap-1">
      <Sparkles className="h-3 w-3" />
      {analysis.score} &middot; {LABEL[analysis.recommendation]}
    </Badge>
  );
}
