"use client";

import type { MouseEvent } from "react";
import { Heart } from "lucide-react";
import { Button } from "../ui/button";
import { useFavoritesStore } from "../../stores/favorites-store";
import { useToggleFavorite } from "../../hooks/useFavorites";
import { cn } from "../../utils/cn";

export function FavoriteButton({ listingId }: { listingId: string }) {
  const isFavorited = useFavoritesStore((state) => state.favoritedIds.has(listingId));
  const toggleFavorite = useToggleFavorite();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite.mutate(listingId);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-transform",
          isFavorited
            ? "scale-110 fill-accent-primary text-accent-primary"
            : "text-text-secondary",
        )}
      />
    </Button>
  );
}
