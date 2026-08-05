"use client";

import { useMemo } from "react";
import type { Listing } from "@vinted-hunter/shared";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export interface ListingFiltersValue {
  brand: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}

export const DEFAULT_LISTING_FILTERS: ListingFiltersValue = {
  brand: "all",
  category: "all",
  minPrice: "",
  maxPrice: "",
};

export interface ListingFiltersProps {
  listings: Listing[];
  brands: string[];
  value: ListingFiltersValue;
  onChange(value: ListingFiltersValue): void;
}

function distinctValues(listings: Listing[], key: "brand" | "category"): string[] {
  const values = listings.map((listing) => listing[key]).filter((v): v is string => Boolean(v));
  return Array.from(new Set(values)).sort();
}

export function ListingFilters({ listings, brands, value, onChange }: ListingFiltersProps) {
  const categories = useMemo(() => distinctValues(listings, "category"), [listings]);

  function update(patch: Partial<ListingFiltersValue>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border-default bg-bg-surface p-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-tertiary">Brand</label>
        <Select value={value.brand} onValueChange={(next) => update({ brand: next })}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any brand</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-tertiary">Category</label>
        <Select value={value.category} onValueChange={(next) => update({ category: next })}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any category</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-tertiary">Min price</label>
        <Input
          type="number"
          className="w-24"
          value={value.minPrice}
          onChange={(event) => update({ minPrice: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-tertiary">Max price</label>
        <Input
          type="number"
          className="w-24"
          value={value.maxPrice}
          onChange={(event) => update({ maxPrice: event.target.value })}
        />
      </div>
      <p className="text-xs text-text-tertiary">Filters apply to this page&apos;s results only.</p>
    </div>
  );
}
