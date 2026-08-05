import { z } from "zod";

export const createSearchSchema = z.object({
  name: z.string().min(1),
  brands: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  excludedKeywords: z.array(z.string()).default([]),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  minimumScore: z.number().int().min(0).max(100).optional(),
  targetRoi: z.number().int().min(0).optional(),
  frequency: z.number().int().positive(),
  enabled: z.boolean().optional(),
});
export type CreateSearchBody = z.infer<typeof createSearchSchema>;

export const updateSearchSchema = createSearchSchema.partial();
export type UpdateSearchBody = z.infer<typeof updateSearchSchema>;
