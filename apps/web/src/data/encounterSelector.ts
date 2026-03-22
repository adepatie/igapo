import type { RiverNode, EncounterNode } from "@igapo/shared";
import { GameState } from "../systems/GameState";
import { ENCOUNTERS } from "./encounterData";

/**
 * Selects the appropriate encounter for a node given current game state.
 * Walks the pool in order, picks all matching entries, then samples by weight.
 * Falls back to the node's primary encounterId.
 */
export function selectEncounter(node: RiverNode, state: GameState): EncounterNode | undefined {
  if (!node.encounterPool || node.encounterPool.length === 0) {
    return ENCOUNTERS[node.encounterId];
  }

  const matching = node.encounterPool.filter((entry) => {
    const c = entry.conditions;
    if (!c) return true;
    if (c.timeOfDay && !c.timeOfDay.includes(state.timeOfDay)) return false;
    if (c.season && !c.season.includes(state.season)) return false;
    if (c.weather && !c.weather.includes(state.weather)) return false;
    return true;
  });

  if (matching.length === 0) return ENCOUNTERS[node.encounterId];

  // Weighted random selection
  const total = matching.reduce((sum, e) => sum + (e.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const entry of matching) {
    r -= entry.weight ?? 1;
    if (r <= 0) return ENCOUNTERS[entry.encounterId] ?? ENCOUNTERS[node.encounterId];
  }

  return ENCOUNTERS[matching[matching.length - 1].encounterId] ?? ENCOUNTERS[node.encounterId];
}
