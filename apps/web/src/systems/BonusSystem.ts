import type { EncounterType } from "@igapo/shared";
import { GameState } from "./GameState";

export interface ActiveBonuses {
  // Success chance modifiers per encounter type
  navigationBonus: number;
  wildlifeBonus: number;
  humanBonus: number;

  // Equipment degrades slower (multiplier: 1.0 = normal, 0.8 = 20% slower)
  equipmentDecayRate: number;

  // Extra choices injected by crew/archetype
  extraWildlifeObserve: boolean;   // dr_melo: "Wildlife Eye"
  extraHumanPress: boolean;        // correspondent archetype
  extraHumanTrust: boolean;        // catarina: "Community Trust" / medic archetype

  // Penalties
  stormMoralePenalty: number;      // raimundo: "Anxious in Storms"
  nightIgapoPenalty: number;       // solange: "Superstitious"

  // Fog of war
  extraRevealDepth: number;        // river_guide: reveals 2 levels ahead instead of 1
}

const DEFAULTS: ActiveBonuses = {
  navigationBonus: 0,
  wildlifeBonus: 0,
  humanBonus: 0,
  equipmentDecayRate: 1.0,
  extraWildlifeObserve: false,
  extraHumanPress: false,
  extraHumanTrust: false,
  stormMoralePenalty: 0,
  nightIgapoPenalty: 0,
  extraRevealDepth: 1,
};

export function computeBonuses(state: GameState): ActiveBonuses {
  const b: ActiveBonuses = { ...DEFAULTS };

  // ── Archetype bonuses ────────────────────────────────────────────────────
  switch (state.archetypeId) {
    case "naturalist":
      b.wildlifeBonus += 0.15;
      b.extraWildlifeObserve = true;
      break;
    case "correspondent":
      b.humanBonus += 0.10;
      b.extraHumanPress = true;
      break;
    case "river_guide":
      b.navigationBonus += 0.20;
      b.extraRevealDepth = 2;
      break;
    case "medic":
      b.humanBonus += 0.15;
      b.extraHumanTrust = true;
      break;
  }

  // ── Crew trait bonuses ───────────────────────────────────────────────────
  for (const member of state.crew) {
    for (const trait of member.traits) {
      switch (trait.id) {
        case "expert_navigator":
          b.navigationBonus += 0.15;
          break;
        case "superstitious":
          if (state.timeOfDay === "night") b.nightIgapoPenalty += 8;
          break;
        case "wildlife_eye":
          b.wildlifeBonus += 0.10;
          b.extraWildlifeObserve = true;
          break;
        case "bad_with_people":
          b.humanBonus -= 0.10;
          break;
        case "engine_sense":
          b.equipmentDecayRate *= 0.80;
          break;
        case "anxious_in_storms":
          b.stormMoralePenalty += 10;
          break;
        case "storm_tested":
          // replaced anxious_in_storms — no penalty
          break;
        case "night_reader":
          // replaced superstitious — no night igapó penalty (and small bonus)
          b.nightIgapoPenalty -= 4; // slight buff vs baseline
          break;
        case "apex_observer":
          b.wildlifeBonus += 0.05;
          break;
        case "bridge_builder":
          b.humanBonus += 0.10;
          b.extraHumanTrust = true;
          break;
        case "community_trust":
          b.humanBonus += 0.15;
          b.extraHumanTrust = true;
          break;
        case "distrusts_researchers":
          // handled in encounter engine — suppresses one researcher choice
          break;
      }
    }
  }

  return b;
}

export function applySuccessBonus(
  baseChance: number,
  type: EncounterType,
  bonuses: ActiveBonuses
): number {
  let bonus = 0;
  if (type === "navigation") bonus = bonuses.navigationBonus;
  else if (type === "wildlife") bonus = bonuses.wildlifeBonus;
  else if (type === "human") bonus = bonuses.humanBonus;
  return Math.min(0.98, Math.max(0.02, baseChance + bonus));
}
