import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Codex.load before importing GameState
vi.mock("../systems/Codex", () => ({
  Codex: {
    load: () => ({
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
    }),
  },
}));

import { GameState } from "../systems/GameState";
import type { Archetype } from "@igapo/shared";

const makeArchetype = (overrides?: Partial<Archetype>): Archetype => ({
  id: "naturalist",
  name: "The Naturalist",
  background: "test",
  startingResources: {
    fuel: 80,
    food: 60,
    medicine: 60,
    equipment: 100,
    morale: 90,
  },
  bonusFieldNoteIds: [],
  ...overrides,
});

describe("GameState", () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState(makeArchetype());
  });

  describe("initialization", () => {
    it("sets resources from archetype", () => {
      expect(state.resources.fuel).toBe(80);
      expect(state.resources.food).toBe(60);
      expect(state.resources.medicine).toBe(60);
      expect(state.resources.equipment).toBe(100);
      expect(state.resources.morale).toBe(90);
    });

    it("starts at dawn on day 1", () => {
      expect(state.timeOfDay).toBe("dawn");
      expect(state.dayNumber).toBe(1);
    });

    it("starts at start node with 0 moves", () => {
      expect(state.currentNodeId).toBe("start");
      expect(state.moveCount).toBe(0);
      expect(state.visitedNodeIds.has("start")).toBe(true);
    });

    it("starts with clear weather", () => {
      expect(state.weather).toBe("clear");
    });
  });

  describe("drainResources", () => {
    it("reduces resources by delta", () => {
      state.drainResources({ fuel: 30 });
      expect(state.resources.fuel).toBe(50);
    });

    it("clamps at zero", () => {
      state.drainResources({ fuel: 200 });
      expect(state.resources.fuel).toBe(0);
    });

    it("handles multiple resources at once", () => {
      state.drainResources({ fuel: 10, food: 20, morale: 30 });
      expect(state.resources.fuel).toBe(70);
      expect(state.resources.food).toBe(40);
      expect(state.resources.morale).toBe(60);
    });
  });

  describe("advanceTime", () => {
    it("cycles through all 5 time periods", () => {
      expect(state.timeOfDay).toBe("dawn");
      state.advanceTime();
      expect(state.timeOfDay).toBe("morning");
      state.advanceTime();
      expect(state.timeOfDay).toBe("afternoon");
      state.advanceTime();
      expect(state.timeOfDay).toBe("dusk");
      state.advanceTime();
      expect(state.timeOfDay).toBe("night");
    });

    it("wraps from night back to dawn and increments day", () => {
      // Advance through a full cycle
      for (let i = 0; i < 5; i++) state.advanceTime();
      expect(state.timeOfDay).toBe("dawn");
      expect(state.dayNumber).toBe(2);
    });
  });

  describe("visitNode", () => {
    it("updates currentNodeId", () => {
      state.visitNode("caiman_bank");
      expect(state.currentNodeId).toBe("caiman_bank");
    });

    it("adds to visitedNodeIds", () => {
      state.visitNode("caiman_bank");
      expect(state.visitedNodeIds.has("caiman_bank")).toBe(true);
    });

    it("increments moveCount", () => {
      state.visitNode("caiman_bank");
      expect(state.moveCount).toBe(1);
      state.visitNode("flooded_forest");
      expect(state.moveCount).toBe(2);
    });
  });

  describe("revealNode", () => {
    it("adds to revealedNodeIds", () => {
      state.revealNode("caiman_bank");
      expect(state.revealedNodeIds.has("caiman_bank")).toBe(true);
    });
  });

  describe("addFieldNote", () => {
    const note = { id: "test_note", species: "Test Species", text: "A test note." };

    it("adds a field note", () => {
      state.addFieldNote(note);
      expect(state.fieldNotes).toContain(note);
      expect(state.unlockedFieldNoteIds.has("test_note")).toBe(true);
    });

    it("is idempotent — no duplicates", () => {
      state.addFieldNote(note);
      state.addFieldNote(note);
      expect(state.fieldNotes).toHaveLength(1);
    });
  });

  describe("hasFieldNote", () => {
    it("returns false for unknown notes", () => {
      expect(state.hasFieldNote("nonexistent")).toBe(false);
    });

    it("returns true after adding note", () => {
      state.addFieldNote({ id: "test", species: "X", text: "Y" });
      expect(state.hasFieldNote("test")).toBe(true);
    });
  });

  describe("weather transitions", () => {
    it("clear can become cloudy", () => {
      state.weather = "clear";
      vi.spyOn(Math, "random").mockReturnValue(0.05); // < 0.15
      state.advanceTime();
      expect(state.weather).toBe("cloudy");
      vi.restoreAllMocks();
    });

    it("clear stays clear on high roll", () => {
      state.weather = "clear";
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      state.advanceTime();
      expect(state.weather).toBe("clear");
      vi.restoreAllMocks();
    });

    it("cloudy can become clear on low roll", () => {
      state.weather = "cloudy";
      vi.spyOn(Math, "random").mockReturnValue(0.05); // < 0.1
      state.advanceTime();
      expect(state.weather).toBe("clear");
      vi.restoreAllMocks();
    });

    it("cloudy can become storm_approaching", () => {
      state.weather = "cloudy";
      vi.spyOn(Math, "random").mockReturnValue(0.15); // >= 0.1 && < 0.25
      state.advanceTime();
      expect(state.weather).toBe("storm_approaching");
      vi.restoreAllMocks();
    });

    it("storm_approaching can become storm", () => {
      state.weather = "storm_approaching";
      vi.spyOn(Math, "random").mockReturnValue(0.3); // < 0.5
      state.advanceTime();
      expect(state.weather).toBe("storm");
      vi.restoreAllMocks();
    });

    it("storm can clear to cloudy", () => {
      state.weather = "storm";
      vi.spyOn(Math, "random").mockReturnValue(0.2); // < 0.4
      state.advanceTime();
      expect(state.weather).toBe("cloudy");
      vi.restoreAllMocks();
    });
  });
});
