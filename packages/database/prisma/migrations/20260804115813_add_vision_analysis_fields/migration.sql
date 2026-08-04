-- AlterTable
ALTER TABLE "analyses" ADD COLUMN     "brandLogoConsistent" BOOLEAN,
ADD COLUMN     "counterfeitRiskFlags" JSONB,
ADD COLUMN     "defects" JSONB,
ADD COLUMN     "extractedLabelText" JSONB,
ADD COLUMN     "photoQualityScore" INTEGER,
ADD COLUMN     "visionAnalyzedAt" TIMESTAMP(3);
