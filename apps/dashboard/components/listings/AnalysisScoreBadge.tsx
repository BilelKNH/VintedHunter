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

// Card-level accent so the best deals pop while scanning a grid, without the score badge text
// being the only signal. IGNORE/WATCH intentionally get no extra treatment — the goal is for
// good opportunities to stand out, not for bad ones to shout just as loud.
const CARD_ACCENT: Record<ListingRecommendation, string> = {
  IGNORE: "",
  WATCH: "",
  GOOD_OPPORTUNITY: "border-accent-secondary/50 shadow-md shadow-accent-secondary/10",
  STRONG_BUY: "border-accent-secondary shadow-lg shadow-accent-secondary/25",
};

export function recommendationCardAccent(
  recommendation: ListingRecommendation | undefined,
): string {
  return recommendation ? CARD_ACCENT[recommendation] : "";
}

export function AnalysisScoreBadge({ analysis }: { analysis: ListingAnalysisSummary }) {
  return (
    <Badge variant={VARIANT[analysis.recommendation]} className="gap-1">
      <Sparkles className="h-3 w-3" />
      {analysis.score} &middot; {LABEL[analysis.recommendation]}
    </Badge>
  );
}
