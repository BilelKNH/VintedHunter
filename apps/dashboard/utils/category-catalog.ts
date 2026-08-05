// Generic apparel categories for SearchForm's "quick add" dropdown. Vinted has no category
// taxonomy this app integrates with yet (packages/crawler queries by free text — see
// build-query.ts), so this is just a convenience list; users can still free-type any category
// via the TagInput it sits next to.
export const KNOWN_CATEGORIES: string[] = [
  "Jacket",
  "Coat",
  "Hoodie",
  "Sweater",
  "T-Shirt",
  "Jeans",
  "Pants",
  "Shorts",
  "Sneakers",
  "Boots",
  "Dress",
  "Skirt",
  "Vest",
  "Accessories",
];
