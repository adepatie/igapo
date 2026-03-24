import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../systems/Codex", () => ({
  Codex: {
    load: vi.fn(() => ({
      allNoteIds: [],
      totalNotes: 0,
      visitedNodeIds: [],
      metaFragments: [],
      totalRuns: 0,
      destinationReached: false,
      naturalistSpecimenBest: 0,
      naturalistGrantsTotal: 0,
      medicClinicRunsTotal: 0,
      medicHealedCommunities: [],
      correspondentTipsTotal: 0,
    })),
    loadEvents: vi.fn(() => ({ events: [], nextEventIndex: 0 })),
  },
}));

import { selectEncounter } from "../data/encounterSelector";
import { ENCOUNTERS } from "../data/encounterData";
import { GameState } from "../systems/GameState";
import { Codex } from "../systems/Codex";
import type { RiverNode, Archetype } from "@igapo/shared";

const makeArchetype = (): Archetype => ({
  id: "naturalist",
  name: "Test",
  background: "test",
  startingResources: { fuel: 100, food: 100, medicine: 100, equipment: 100, morale: 100 },
  bonusFieldNoteIds: [],
});

const makeNode = (overrides?: Partial<RiverNode>): RiverNode => ({
  id: "test_node",
  name: "Test Node",
  type: "wildlife",
  region: "várzea",
  x: 0,
  y: 0,
  encounterId: "wildlife_caiman",
  ...overrides,
});

describe("encounterSelector", () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState(makeArchetype());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns primary encounter when no pool", () => {
    const node = makeNode({ encounterPool: undefined });
    const result = selectEncounter(node, state);
    expect(result).toBe(ENCOUNTERS["wildlife_caiman"]);
  });

  it("returns primary encounter when pool is empty", () => {
    const node = makeNode({ encounterPool: [] });
    const result = selectEncounter(node, state);
    expect(result).toBe(ENCOUNTERS["wildlife_caiman"]);
  });

  it("filters by season", () => {
    state.season = "dry";
    const node = makeNode({
      encounterPool: [
        { encounterId: "wildlife_caiman", conditions: { season: ["wet"] }, weight: 1 },
      ],
    });
    // No matching entries → falls back to primary
    const result = selectEncounter(node, state);
    expect(result).toBe(ENCOUNTERS["wildlife_caiman"]);
  });

  it("selects matching season entry", () => {
    state.season = "wet";
    vi.spyOn(Math, "random").mockReturnValue(0);
    const node = makeNode({
      encounterPool: [
        { encounterId: "wildlife_boto", conditions: { season: ["wet"] }, weight: 1 },
      ],
    });
    const result = selectEncounter(node, state);
    expect(result).toBe(ENCOUNTERS["wildlife_boto"]);
  });

  it("filters by timeOfDay", () => {
    state.timeOfDay = "night";
    const node = makeNode({
      encounterPool: [
        { encounterId: "wildlife_boto", conditions: { timeOfDay: ["morning", "afternoon"] }, weight: 1 },
      ],
    });
    const result = selectEncounter(node, state);
    expect(result).toBe(ENCOUNTERS["wildlife_caiman"]); // fallback
  });

  it("filters by weather", () => {
    state.weather = "clear";
    const node = makeNode({
      encounterPool: [
        { encounterId: "crisis_storm", conditions: { weather: ["storm"] }, weight: 1 },
      ],
    });
    const result = selectEncounter(node, state);
    expect(result).toBe(ENCOUNTERS["wildlife_caiman"]); // fallback
  });

  it("filters by minRun", () => {
    vi.mocked(Codex.load).mockReturnValue({
      allNoteIds: [],
      totalNotes: 0,
      visitedNodeIds: [],
      metaFragments: [],
      totalRuns: 0,
      destinationReached: false,
      naturalistSpecimenBest: 0,
      naturalistGrantsTotal: 0,
      medicClinicRunsTotal: 0,
      medicHealedCommunities: [],
      correspondentTipsTotal: 0,
    });
    const node = makeNode({
      encounterPool: [
        { encounterId: "story_destination_fragments", conditions: { minRun: 2 }, weight: 1 },
      ],
    });
    const result = selectEncounter(node, state);
    expect(result).toBe(ENCOUNTERS["wildlife_caiman"]); // fallback, totalRuns=0 < 2
  });

  it("allows entry when minRun is met", () => {
    vi.mocked(Codex.load).mockReturnValue({
      allNoteIds: [],
      totalNotes: 0,
      visitedNodeIds: [],
      metaFragments: [],
      totalRuns: 3,
      destinationReached: false,
      naturalistSpecimenBest: 0,
      naturalistGrantsTotal: 0,
      medicClinicRunsTotal: 0,
      medicHealedCommunities: [],
      correspondentTipsTotal: 0,
    });
    vi.spyOn(Math, "random").mockReturnValue(0);
    const node = makeNode({
      encounterPool: [
        { encounterId: "story_destination_fragments", conditions: { minRun: 2 }, weight: 1 },
      ],
    });
    const result = selectEncounter(node, state);
    expect(result).toBe(ENCOUNTERS["story_destination_fragments"]);
  });

  it("unconditional pool entries always match", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const node = makeNode({
      encounterPool: [
        { encounterId: "wildlife_boto", weight: 1 },
      ],
    });
    const result = selectEncounter(node, state);
    expect(result).toBe(ENCOUNTERS["wildlife_boto"]);
  });
});
