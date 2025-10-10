import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChoiceList } from "../components/ChoiceList";

const baseChoices = [
  { id: "c1", label: "Scout ahead", description: "Send scouts", index: 0 },
  { id: "c2", label: "Camp here", description: "Rest the crew", index: 1 },
];

describe("ChoiceList", () => {
  it("renders choices and handles selection", () => {
    const handleSelect = vi.fn();

    render(<ChoiceList choices={baseChoices} onSelect={handleSelect} />);

    expect(screen.getByText(/Scout ahead/)).toBeVisible();

    fireEvent.click(screen.getByText(/Camp here/));

    expect(handleSelect).toHaveBeenCalledWith("c2");
  });

  it("shows empty state", () => {
    render(<ChoiceList choices={[]} onSelect={() => {}} />);

    expect(screen.getByText(/No choices available/)).toBeVisible();
  });
});
