import { describe, it, expect, vi, beforeEach } from "vitest";

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
    loadEvents: () => ({ events: [], nextEventIndex: 0 }),
  },
}));

import { computeBonuses, applySuccessBonus } from "../systems/BonusSystem";
import { GameState } from "../systems/GameState";
import type { Archetype, CrewMember } from "@igapo/shared";

const makeArchetype = (id: string): Archetype => ({
  id: id as Archetype["id"],
  name: "Test",
  background: "test",
  startingResources: { fuel: 100, food: 100, medicine: 100, equipment: 100, morale: 100 },
  bonusFieldNoteIds: [],
});

const makeCrewMember = (id: string, traitIds: string[]): CrewMember => ({
  id,
  name: "Test",
  role: "Test",
  morale: 100,
  traits: traitIds.map((tid) => ({ id: tid, label: tid, description: "test" })),
});

describe("BonusSystem", () => {
  describe("computeBonuses — archetype bonuses", () => {
    it("naturalist gets wildlife bonus and extra observe", () => {
      const state = new GameState(makeArchetype("naturalist"));
      const b = computeBonuses(state);
      expect(b.wildlifeBonus).toBe(0.15);
      expect(b.extraWildlifeObserve).toBe(true);
    });

    it("correspondent gets human bonus and press", () => {
      const state = new GameState(makeArchetype("correspondent"));
      const b = computeBonuses(state);
      expect(b.humanBonus).toBe(0.10);
      expect(b.extraHumanPress).toBe(true);
    });

    it("river_guide gets navigation bonus and extra reveal", () => {
      const state = new GameState(makeArchetype("river_guide"));
      const b = computeBonuses(state);
      expect(b.navigationBonus).toBe(0.20);
      expect(b.extraRevealDepth).toBe(2);
    });

    it("medic gets human bonus and trust", () => {
      const state = new GameState(makeArchetype("medic"));
      const b = computeBonuses(state);
      expect(b.humanBonus).toBe(0.15);
      expect(b.extraHumanTrust).toBe(true);
    });
  });

  describe("computeBonuses — crew trait stacking", () => {
    it("expert_navigator adds navigation bonus", () => {
      const state = new GameState(makeArchetype("naturalist"));
      state.crew = [makeCrewMember("solange", ["expert_navigator"])];
      const b = computeBonuses(state);
      expect(b.navigationBonus).toBe(0.15);
    });

    it("wildlife_eye stacks with naturalist", () => {
      const state = new GameState(makeArchetype("naturalist"));
      state.crew = [makeCrewMember("dr_melo", ["wildlife_eye"])];
      const b = computeBonuses(state);
      expect(b.wildlifeBonus).toBe(0.25); // 0.15 + 0.10
      expect(b.extraWildlifeObserve).toBe(true);
    });

    it("bad_with_people reduces human bonus", () => {
      const state = new GameState(makeArchetype("medic"));
      state.crew = [makeCrewMember("dr_melo", ["bad_with_people"])];
      const b = computeBonuses(state);
      expect(b.humanBonus).toBeCloseTo(0.05); // 0.15 - 0.10
    });

    it("engine_sense reduces equipment decay rate", () => {
      const state = new GameState(makeArchetype("naturalist"));
      state.crew = [makeCrewMember("raimundo", ["engine_sense"])];
      const b = computeBonuses(state);
      expect(b.equipmentDecayRate).toBe(0.80);
    });

    it("anxious_in_storms adds storm morale penalty", () => {
      const state = new GameState(makeArchetype("naturalist"));
      state.crew = [makeCrewMember("raimundo", ["anxious_in_storms"])];
      const b = computeBonuses(state);
      expect(b.stormMoralePenalty).toBe(10);
    });

    it("superstitious adds night penalty", () => {
      const state = new GameState(makeArchetype("naturalist"));
      state.timeOfDay = "night";
      state.crew = [makeCrewMember("solange", ["superstitious"])];
      const b = computeBonuses(state);
      expect(b.nightIgapoPenalty).toBe(8);
    });

    it("superstitious has no penalty during day", () => {
      const state = new GameState(makeArchetype("naturalist"));
      state.timeOfDay = "morning";
      state.crew = [makeCrewMember("solange", ["superstitious"])];
      const b = computeBonuses(state);
      expect(b.nightIgapoPenalty).toBe(0);
    });
  });

  describe("computeBonuses — evolved traits", () => {
    it("storm_tested removes storm penalty", () => {
      const state = new GameState(makeArchetype("naturalist"));
      state.crew = [makeCrewMember("raimundo", ["storm_tested"])];
      const b = computeBonuses(state);
      expect(b.stormMoralePenalty).toBe(0);
    });

    it("night_reader provides slight night buff", () => {
      const state = new GameState(makeArchetype("naturalist"));
      state.crew = [makeCrewMember("solange", ["night_reader"])];
      const b = computeBonuses(state);
      expect(b.nightIgapoPenalty).toBe(-4);
    });

    it("bridge_builder adds human bonus and trust", () => {
      const state = new GameState(makeArchetype("naturalist"));
      state.crew = [makeCrewMember("catarina", ["bridge_builder"])];
      const b = computeBonuses(state);
      expect(b.humanBonus).toBe(0.10);
      expect(b.extraHumanTrust).toBe(true);
    });
  });

  describe("applySuccessBonus", () => {
    it("applies navigation bonus to navigation encounters", () => {
      const result = applySuccessBonus(0.5, "navigation", {
        ...computeBonuses(new GameState(makeArchetype("naturalist"))),
        navigationBonus: 0.2,
      });
      expect(result).toBe(0.7);
    });

    it("applies wildlife bonus to wildlife encounters", () => {
      const result = applySuccessBonus(0.5, "wildlife", {
        ...computeBonuses(new GameState(makeArchetype("naturalist"))),
        wildlifeBonus: 0.15,
      });
      expect(result).toBe(0.65);
    });

    it("clamps at 0.98 maximum", () => {
      const result = applySuccessBonus(0.95, "navigation", {
        ...computeBonuses(new GameState(makeArchetype("naturalist"))),
        navigationBonus: 0.5,
      });
      expect(result).toBe(0.98);
    });

    it("clamps at 0.02 minimum", () => {
      const result = applySuccessBonus(0.0, "human", {
        ...computeBonuses(new GameState(makeArchetype("naturalist"))),
        humanBonus: -0.5,
      });
      expect(result).toBe(0.02);
    });

    it("does not apply bonus for non-matching encounter types", () => {
      const result = applySuccessBonus(0.5, "discovery", {
        ...computeBonuses(new GameState(makeArchetype("naturalist"))),
        navigationBonus: 0.5,
        wildlifeBonus: 0.5,
        humanBonus: 0.5,
      });
      expect(result).toBe(0.5);
    });
  });
});
