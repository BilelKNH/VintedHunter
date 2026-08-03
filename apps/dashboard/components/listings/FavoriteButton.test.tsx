import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FavoriteButton } from "./FavoriteButton";
import { useFavoritesStore } from "../../stores/favorites-store";
import * as listingsService from "../../services/listings.service";

vi.mock("../../services/listings.service", () => ({
  toggleFavorite: vi.fn(),
}));

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  useFavoritesStore.setState({ favoritedIds: new Set() });
  vi.clearAllMocks();
});

describe("FavoriteButton", () => {
  it("shows the 'add' state when not favorited", () => {
    renderWithClient(<FavoriteButton listingId="listing-1" />);

    expect(screen.getByRole("button", { name: "Add to favorites" })).toBeInTheDocument();
  });

  it("shows the 'remove' state when already favorited", () => {
    useFavoritesStore.setState({ favoritedIds: new Set(["listing-1"]) });

    renderWithClient(<FavoriteButton listingId="listing-1" />);

    expect(screen.getByRole("button", { name: "Remove from favorites" })).toBeInTheDocument();
  });

  it("optimistically flips to the 'remove' state on click, before the request resolves", async () => {
    vi.mocked(listingsService.toggleFavorite).mockResolvedValue({ favorited: true });
    const user = userEvent.setup();
    renderWithClient(<FavoriteButton listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    expect(screen.getByRole("button", { name: "Remove from favorites" })).toBeInTheDocument();
  });

  it("reverts the optimistic toggle if the request fails", async () => {
    vi.mocked(listingsService.toggleFavorite).mockRejectedValue(new Error("network error"));
    const user = userEvent.setup();
    renderWithClient(<FavoriteButton listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    expect(await screen.findByRole("button", { name: "Add to favorites" })).toBeInTheDocument();
  });
});
