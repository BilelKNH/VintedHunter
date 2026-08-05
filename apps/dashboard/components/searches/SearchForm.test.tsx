import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchForm } from "./SearchForm";

describe("SearchForm", () => {
  it("shows an error and does not submit when name is empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<SearchForm submitLabel="Create" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a payload matching the createSearchSchema shape", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SearchForm submitLabel="Create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Nike Hunter");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Nike Hunter",
      brands: [],
      categories: [],
      sizes: [],
      keywords: [],
      excludedKeywords: [],
      minPrice: undefined,
      maxPrice: undefined,
      minimumScore: 70,
      targetRoi: 30,
      frequency: 60,
      enabled: true,
    });
  });

  it("includes a brand added via the tag input in the submitted payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SearchForm submitLabel="Create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Nike Hunter");
    await user.type(screen.getByPlaceholderText("Nike, Stone Island…"), "Nike{Enter}");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ brands: ["Nike"] }));
  });

  it("quick-adding a brand adds it to Brands and its typo/apostrophe variants to Keywords", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SearchForm submitLabel="Create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Name"), "Arcteryx Hunter");
    await user.click(screen.getByRole("combobox", { name: "Quick add brand" }));
    await user.click(await screen.findByRole("option", { name: "Arc'teryx" }));
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        brands: ["Arc'teryx"],
        keywords: expect.arrayContaining(["Arcteryx", "Arc teryx"]),
      }),
    );
  });

  it("pre-fills fields from initialValues", () => {
    render(
      <SearchForm
        submitLabel="Save"
        initialValues={{ name: "Existing search", frequency: 1440 }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Existing search");
  });
});
