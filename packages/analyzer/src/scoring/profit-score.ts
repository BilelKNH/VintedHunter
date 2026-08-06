// Weight: 20% of the overall score — normalizes roi (§47's percentage convention, e.g. 150
// means +150%) onto the same 0-100 scale as every other sub-score.
const ROI_SATURATION = 150;

export function computeProfitScore(roi: number): number {
  if (roi <= 0) {
    return 0;
  }
  if (roi >= ROI_SATURATION) {
    return 100;
  }
  return Math.round((roi / ROI_SATURATION) * 100);
}
