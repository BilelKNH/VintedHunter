"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Search } from "@vinted-hunter/shared";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { SearchEnabledToggle } from "./SearchEnabledToggle";
import { DeleteSearchDialog } from "./DeleteSearchDialog";

function formatFrequency(minutes: number): string {
  if (minutes >= 1440) return `${minutes / 1440}d`;
  if (minutes >= 60) return `${minutes / 60}h`;
  return `${minutes}m`;
}

export function SearchTable({ searches }: { searches: Search[] }) {
  const [deleteTarget, setDeleteTarget] = useState<Search | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-border-default bg-bg-surface">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-default text-xs uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Brands</th>
            <th className="px-4 py-3 font-medium">Max price</th>
            <th className="px-4 py-3 font-medium">Frequency</th>
            <th className="px-4 py-3 font-medium">Enabled</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {searches.map((search) => (
            <tr
              key={search.id}
              className="border-b border-border-default last:border-0 hover:bg-bg-elevated"
            >
              <td className="px-4 py-3 font-medium text-text-primary">{search.name}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {search.brands.length > 0 ? (
                    search.brands.map((brand) => <Badge key={brand}>{brand}</Badge>)
                  ) : (
                    <span className="text-text-tertiary">Any</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 font-numeric text-text-secondary">
                {search.maxPrice != null ? `€${search.maxPrice}` : "—"}
              </td>
              <td className="px-4 py-3 font-numeric text-text-secondary">
                {formatFrequency(search.frequency)}
              </td>
              <td className="px-4 py-3">
                <SearchEnabledToggle searchId={search.id} enabled={search.enabled} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/searches/${search.id}/edit`} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(search)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {deleteTarget ? (
        <DeleteSearchDialog
          searchId={deleteTarget.id}
          searchName={deleteTarget.name}
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
