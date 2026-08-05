// Curated brands worth a "quick add" in SearchForm — mirrors the brands
// @vinted-hunter/analyzer's brand-score.ts already treats as high/mid resale value, so the
// dropdown and the scoring engine agree on what's worth searching for. Not exhaustive: users can
// still free-type any brand via the TagInput this dropdown sits next to.
export interface KnownBrand {
  name: string;
  // Hand-curated typo variants beyond what the apostrophe rule below already covers — only add
  // one here when it's a real, common resale-listing spelling (e.g. a well-known abbreviation),
  // not a speculative guess.
  extraKeywordVariants?: string[];
}

export const KNOWN_BRANDS: KnownBrand[] = [
  { name: "Nike" },
  { name: "Adidas" },
  { name: "Carhartt" },
  { name: "Patagonia" },
  { name: "The North Face", extraKeywordVariants: ["TNF"] },
  { name: "Stone Island" },
  { name: "Arc'teryx" },
  { name: "Levi's" },
  { name: "Supreme" },
  { name: "Ralph Lauren" },
];

// A brand with an apostrophe is routinely typed without one, or with a space in its place
// (e.g. "Arc'teryx" -> "Arcteryx" / "Arc teryx") — generic enough to apply to any brand name,
// not just the ones we happened to think of.
function apostropheVariants(name: string): string[] {
  if (!name.includes("'")) {
    return [];
  }
  return [name.replace(/'/g, ""), name.replace(/'/g, " ").replace(/\s+/g, " ").trim()];
}

export function keywordSuggestionsForBrand(brand: KnownBrand): string[] {
  return [...new Set([...(brand.extraKeywordVariants ?? []), ...apostropheVariants(brand.name)])];
}
