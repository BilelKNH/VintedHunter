// §47: only notify when a listing clears all three bars.
const MIN_SCORE = 90;
const MIN_ROI_PERCENT = 100;
const MIN_PROFIT = 50;

export interface NotifiableAnalysis {
  score: number;
  roi: number; // percentage, matches @vinted-hunter/analyzer's AnalysisResult.roi
  estimatedProfit: number;
}

export function shouldNotify(analysis: NotifiableAnalysis): boolean {
  return (
    analysis.score > MIN_SCORE &&
    analysis.roi > MIN_ROI_PERCENT &&
    analysis.estimatedProfit > MIN_PROFIT
  );
}
