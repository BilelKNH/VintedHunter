import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "./tag-input";

describe("TagInput", () => {
  it("commits a tag on Enter and clears the draft", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<TagInput value={[]} onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "Nike{Enter}");

    expect(onChange).toHaveBeenCalledWith(["Nike"]);
    rerender(<TagInput value={["Nike"]} onChange={onChange} />);
    expect(screen.getByText("Nike")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("commits a tag on comma", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "Stone Island,");

    expect(onChange).toHaveBeenCalledWith(["Stone Island"]);
  });

  it("does not add a duplicate tag", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={["Nike"]} onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "Nike{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes the last tag on Backspace when the draft is empty", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={["Nike", "Stone Island"]} onChange={onChange} />);

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Backspace}");

    expect(onChange).toHaveBeenCalledWith(["Nike"]);
  });

  it("removes a tag via its remove button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={["Nike"]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Remove Nike" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("commits the draft on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <div>
        <TagInput value={[]} onChange={onChange} />
        <button type="button">Elsewhere</button>
      </div>,
    );

    await user.type(screen.getByRole("textbox"), "Arc'Teryx");
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(onChange).toHaveBeenCalledWith(["Arc'Teryx"]);
  });
});
