// §47: only notify when a listing clears all three bars — score against the triggering
// search's own minimumScore (Search.minimumScore, previously hardcoded here and unconnected to
// that field), plus a fixed ROI/profit floor as an anti-spam safety net that holds regardless of
// how low a search's minimumScore is set.
const DEFAULT_MINIMUM_SCORE = 70; // mirrors Search.minimumScore's own @default(70)
const MIN_ROI_PERCENT = 100;
const MIN_PROFIT = 50;

export interface NotifiableAnalysis {
  score: number;
  roi: number; // percentage, matches @vinted-hunter/analyzer's AnalysisResult.roi
  estimatedProfit: number;
}

export function shouldNotify(
  analysis: NotifiableAnalysis,
  minimumScore: number = DEFAULT_MINIMUM_SCORE,
): boolean {
  return (
    analysis.score > minimumScore &&
    analysis.roi > MIN_ROI_PERCENT &&
    analysis.estimatedProfit > MIN_PROFIT
  );
}
