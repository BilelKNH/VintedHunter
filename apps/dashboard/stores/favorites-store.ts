import { create } from "zustand";

interface FavoritesState {
  favoritedIds: Set<string>;
  setFavoritedIds(ids: string[]): void;
  toggle(id: string): void;
}

// Optimistic client-side cache of favorited listing ids — seeded from GET /listings/favorites
// and updated immediately on toggle for instant heart-fill feedback, ahead of the mutation
// actually resolving.
export const useFavoritesStore = create<FavoritesState>((set) => ({
  favoritedIds: new Set(),
  setFavoritedIds: (ids) => set({ favoritedIds: new Set(ids) }),
  toggle: (id) =>
    set((state) => {
      const next = new Set(state.favoritedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { favoritedIds: next };
    }),
}));
