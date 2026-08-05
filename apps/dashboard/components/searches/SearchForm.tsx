"use client";

import { useState, type FormEvent } from "react";
import type { CreateSearchBody } from "@vinted-hunter/shared";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { TagInput } from "../ui/tag-input";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const FREQUENCY_PRESETS = [
  { label: "Every 15 minutes", value: 15 },
  { label: "Every hour", value: 60 },
  { label: "Every 6 hours", value: 360 },
  { label: "Every 24 hours", value: 1440 },
];

export interface SearchFormValues {
  name: string;
  brands: string[];
  categories: string[];
  sizes: string[];
  keywords: string[];
  excludedKeywords: string[];
  minPrice: string;
  maxPrice: string;
  minimumScore: number;
  targetRoi: number;
  frequency: number;
  enabled: boolean;
}

const EMPTY_VALUES: SearchFormValues = {
  name: "",
  brands: [],
  categories: [],
  sizes: [],
  keywords: [],
  excludedKeywords: [],
  minPrice: "",
  maxPrice: "",
  minimumScore: 70,
  targetRoi: 30,
  frequency: 60,
  enabled: true,
};

export interface SearchFormProps {
  initialValues?: Partial<SearchFormValues>;
  onSubmit(values: CreateSearchBody): Promise<void>;
  submitLabel: string;
}

export function SearchForm({ initialValues, onSubmit, submitLabel }: SearchFormProps) {
  const [values, setValues] = useState<SearchFormValues>({ ...EMPTY_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof SearchFormValues>(key: K, value: SearchFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!values.name.trim()) {
      setError("Name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: values.name,
        brands: values.brands,
        categories: values.categories,
        sizes: values.sizes,
        keywords: values.keywords,
        excludedKeywords: values.excludedKeywords,
        minPrice: values.minPrice ? Number(values.minPrice) : undefined,
        maxPrice: values.maxPrice ? Number(values.maxPrice) : undefined,
        minimumScore: values.minimumScore,
        targetRoi: values.targetRoi,
        frequency: values.frequency,
        enabled: values.enabled,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Nike Tech Fleece Hunter"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Brands</Label>
          <TagInput
            value={values.brands}
            onChange={(next) => update("brands", next)}
            placeholder="Nike, Stone Island…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Categories</Label>
          <TagInput
            value={values.categories}
            onChange={(next) => update("categories", next)}
            placeholder="Hoodie, Jacket…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Sizes</Label>
          <TagInput
            value={values.sizes}
            onChange={(next) => update("sizes", next)}
            placeholder="M, L, XL…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Keywords</Label>
          <TagInput
            value={values.keywords}
            onChange={(next) => update("keywords", next)}
            placeholder="tech fleece…"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Excluded keywords</Label>
        <TagInput
          value={values.excludedKeywords}
          onChange={(next) => update("excludedKeywords", next)}
          placeholder="replica, fake…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="minPrice">Min price (€)</Label>
          <Input
            id="minPrice"
            type="number"
            min={0}
            value={values.minPrice}
            onChange={(event) => update("minPrice", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maxPrice">Max price (€)</Label>
          <Input
            id="maxPrice"
            type="number"
            min={0}
            value={values.maxPrice}
            onChange={(event) => update("maxPrice", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="minimumScore">Minimum score</Label>
          <Input
            id="minimumScore"
            type="number"
            min={0}
            max={100}
            value={values.minimumScore}
            onChange={(event) => update("minimumScore", Number(event.target.value))}
          />
          <p className="text-xs text-text-tertiary">
            Used once opportunity scoring ships in Phase 5.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetRoi">Target margin (ROI %)</Label>
          <Input
            id="targetRoi"
            type="number"
            min={0}
            value={values.targetRoi}
            onChange={(event) => update("targetRoi", Number(event.target.value))}
          />
          <p className="text-xs text-text-tertiary">
            Caps the recommended max buy price shown on matching listings.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Scan frequency</Label>
          <Select
            value={String(values.frequency)}
            onValueChange={(next) => update("frequency", Number(next))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={String(preset.value)}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border-default bg-bg-elevated px-4 py-3">
        <div>
          <p className="text-sm font-medium text-text-primary">Enabled</p>
          <p className="text-xs text-text-tertiary">
            Inactive searches are skipped once the crawler ships.
          </p>
        </div>
        <Switch checked={values.enabled} onCheckedChange={(next) => update("enabled", next)} />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
