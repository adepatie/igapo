import { describe, it, expect } from "vitest";

describe("Module imports (smoke test)", () => {
  it("can import all shared types", async () => {
    const shared = await import("@igapo/shared");
    expect(shared.ARCHETYPES).toBeDefined();
    expect(shared.ARCHETYPES.length).toBe(4);
  });

  it("can import encounter data", async () => {
    const { ENCOUNTERS, FIELD_NOTES_BY_ID } = await import("../data/encounterData");
    expect(Object.keys(ENCOUNTERS).length).toBeGreaterThan(0);
    expect(Object.keys(FIELD_NOTES_BY_ID).length).toBeGreaterThan(0);
  });

  it("can import map generator", async () => {
    const { generateRun } = await import("../data/mapGenerator");
    const { nodes, edges } = generateRun();
    expect(nodes.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);
  });

  it("can import meta fragments", async () => {
    const { META_FRAGMENTS } = await import("../data/metaFragments");
    expect(Object.keys(META_FRAGMENTS).length).toBe(8);
  });

  it("can import BonusSystem", async () => {
    const { computeBonuses, applySuccessBonus } = await import("../systems/BonusSystem");
    expect(typeof computeBonuses).toBe("function");
    expect(typeof applySuccessBonus).toBe("function");
  });

  it("can import Codex", async () => {
    const { Codex } = await import("../systems/Codex");
    expect(typeof Codex.load).toBe("function");
    expect(typeof Codex.save).toBe("function");
    expect(typeof Codex.recordRun).toBe("function");
  });

  it("can import encounterSelector", async () => {
    const { selectEncounter } = await import("../data/encounterSelector");
    expect(typeof selectEncounter).toBe("function");
  });
});
