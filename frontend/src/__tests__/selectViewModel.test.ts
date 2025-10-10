import { describe, expect, it } from "vitest";
import { selectViewModel } from "../selectors/selectViewModel";
import type { BackendState, NarrativeProse } from "../game-client/types";

describe("selectViewModel", () => {
  const baseState: BackendState = {
    hash: "abc123",
    location: "Manaus",
    journal: [{ id: "j1", text: "Set sail at dawn." }],
    choices: [
      { id: "c1", label: "Sail forward", description: "Head deeper upriver" },
    ],
    facts: [{ id: "f1", label: "River width", detail: "4 km" }],
  };

  const baseProse: NarrativeProse = {
    title: "The River Widens",
    summary: "Mist rises as you weigh options.",
    paragraphs: ["Mist rises as you weigh options."],
    outcome: "success",
    facts: [{ id: "f2", label: "Dolphins spotted" }],
    journal_entry: { id: "j2", text: "Met a friendly trader." },
  };

  it("composes a rich view model", () => {
    const model = selectViewModel(baseState, baseProse);

    expect(model.banner.title).toBe("The River Widens");
    expect(model.banner.subtitle).toContain("Mist rises");
    expect(model.banner.mood).toBe("success");
    expect(model.narrative).toHaveLength(1);
    expect(model.choices[0]).toMatchObject({ id: "c1", index: 0 });
    expect(model.facts).toEqual(["River width — 4 km", "Dolphins spotted"]);
    expect(model.journal).toHaveLength(2);
    expect(model.stateHash).toBe("abc123");
  });

  it("falls back to derived hash when absent", () => {
    const model = selectViewModel({ ...baseState, hash: undefined }, baseProse);
    expect(model.stateHash).toMatch(/^hash_/);
  });
});
