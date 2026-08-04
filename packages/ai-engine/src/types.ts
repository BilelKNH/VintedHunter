// §13/§61: photos actually inspected via Claude Vision, not just their URLs stored.
export interface VisionAnalysisInput {
  imageUrls: string[];
  brand: string | null;
  category: string | null;
  condition: string | null;
}

// Mirrors the new nullable columns added to the Analysis model (see the plan's Prisma
// migration) — this is the shape persisted verbatim by apps/worker's analysis repository.
export interface VisionAnalysisResult {
  photoQualityScore: number;
  defects: string[];
  extractedLabelText: string[];
  brandLogoConsistent: boolean | null;
  counterfeitRiskFlags: string[];
}

export interface VisionAnalyzer {
  analyze(input: VisionAnalysisInput): Promise<VisionAnalysisResult>;
}
