"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import {
  useCreateManualComparable,
  useDeleteManualComparable,
  useManualComparables,
} from "../../hooks/useManualComparables";
import { useAuthStore } from "../../stores/auth-store";
import { formatPrice } from "../../utils/format";
import { ApiError } from "../../services/api-client";

export function ManualComparablesCard({ listingId }: { listingId: string }) {
  const { data: comparables, isLoading } = useManualComparables(listingId);
  const createComparable = useCreateManualComparable(listingId);
  const deleteComparable = useDeleteManualComparable(listingId);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [price, setPrice] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedPrice = Number(price);
    if (!(parsedPrice > 0)) {
      toast.error("Enter a valid price");
      return;
    }
    if (!sourceName.trim()) {
      toast.error("Enter where you saw this price");
      return;
    }
    createComparable.mutate(
      {
        price: parsedPrice,
        sourceName: sourceName.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Comparable price added");
          setPrice("");
          setSourceName("");
          setSourceUrl("");
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Something went wrong"),
      },
    );
  }

  function handleDelete(id: string) {
    deleteComparable.mutate(id, {
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Something went wrong"),
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border-default bg-bg-elevated p-3">
      <p className="text-xs font-medium text-text-secondary">Prix observés ailleurs</p>

      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : comparables && comparables.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {comparables.map((comparable) => (
            <li
              key={comparable.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-numeric font-semibold text-text-primary">
                  {formatPrice(comparable.price, comparable.currency)}
                </span>
                <span className="text-text-tertiary">{comparable.sourceName}</span>
                {comparable.sourceUrl ? (
                  <a
                    href={comparable.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-tertiary hover:text-accent-primary"
                    aria-label={`Open source for ${comparable.sourceName}`}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
              {comparable.userId === currentUserId ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleDelete(comparable.id)}
                  disabled={deleteComparable.isPending}
                  aria-label="Remove this comparable price"
                >
                  <Trash2 className="h-3.5 w-3.5 text-text-tertiary" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-text-tertiary">
          Aucun prix observé pour l&apos;instant — ajoute ce que tu trouves ailleurs (eBay,
          Vestiaire, Depop…).
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="comparable-price" className="text-xs">
            Prix
          </Label>
          <Input
            id="comparable-price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-24"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="comparable-source" className="text-xs">
            Source
          </Label>
          <Input
            id="comparable-source"
            placeholder="eBay"
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
            className="w-28"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="comparable-url" className="text-xs">
            Lien (optionnel)
          </Label>
          <Input
            id="comparable-url"
            type="url"
            placeholder="https://…"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            className="w-36"
          />
        </div>
        <Button type="submit" disabled={createComparable.isPending}>
          {createComparable.isPending ? "Ajout…" : "Ajouter"}
        </Button>
      </form>
    </div>
  );
}
