/**
 * Crew Registry
 *
 * Crew members are persistent world entities. They exist between runs,
 * have histories with specific characters, and decide whether to travel
 * again based on what happened before.
 */

import type { ArchetypeId } from "./types";
import type { RunOutcome } from "./mission";

// ── Crew status ──────────────────────────────────────────────────────────────

export type CrewStatus =
  | "available"     // can be recruited at their current location
  | "unavailable"   // alive but not willing to work right now
  | "missing"       // whereabouts unknown after a traumatic run event
  | "deceased";     // dead; permanently removed from recruitment pool

// ── Join condition ───────────────────────────────────────────────────────────

/**
 * Determines how a crew member responds to a recruitment attempt,
 * based on derived relationship state.
 */
export type JoinCondition =
  | { type: "gift";    item: string;  text: string }  // trust >= 7: they have something for you
  | { type: "neutral";               text: string }   // trust 3–6: happy to sail
  | { type: "demand";  price: string; text: string }  // trust 0–2: wants something first
  | { type: "refuse";                text: string }   // trust < 0: won't go
  | { type: "never_shipped";         text: string };  // first meeting

// ── Relationship history ─────────────────────────────────────────────────────

export interface CrewRelationshipEntry {
  runId: number;
  archetypeId: ArchetypeId;
  trustDelta: number;        // net trust change over this run (+/-)
  moraleEnd: number;         // their morale at run end
  notableEventIds: string[]; // encounter IDs of shared significant moments
  runOutcome: RunOutcome;
}

// ── Crew record (persistent) ─────────────────────────────────────────────────

/**
 * The canonical persistent record for a crew member.
 * Lives in the player profile alongside the Event Log.
 */
export interface CrewRecord {
  id: string;
  name: string;
  role: string;
  currentStatus: CrewStatus;
  /** Where they are between runs (map node ID). Null if location unknown (missing). */
  currentLocationNodeId: string | null;
  traits: string[];          // trait IDs — can evolve via growth system
  relationshipHistory: CrewRelationshipEntry[];
}

// ── Derived crew state ───────────────────────────────────────────────────────

/**
 * Computed from relationship history. Trust is archetype-weighted:
 * runs with the same archetype as current = full weight;
 * different archetype = 20% weight (reputation travels faintly).
 */
export interface DerivedCrewState {
  crewId: string;
  /** -10 to +10; archetype-weighted aggregate. */
  trust: number;
  sharedExperienceIds: string[]; // notable events appearing in ≥2 runs together
  lastRunOutcome: RunOutcome | "never_shipped";
  timesShippedTogether: number;
  survivedDeathTogether: boolean;
  joinCondition: JoinCondition;
}

// ── Registry store (persisted) ───────────────────────────────────────────────

export interface CrewRegistryStore {
  records: CrewRecord[];
  version: number;
}

export function emptyCrewRegistry(): CrewRegistryStore {
  return { records: [], version: 1 };
}

// ── Derivation helper ────────────────────────────────────────────────────────

/**
 * Derives trust for a crew member relative to a specific archetype.
 * Full weight for matching archetype runs; 20% weight for others.
 */
export function deriveCrewTrust(
  history: CrewRelationshipEntry[],
  currentArchetypeId: ArchetypeId,
): number {
  let trust = 0;
  for (const entry of history) {
    const weight = entry.archetypeId === currentArchetypeId ? 1.0 : 0.2;
    trust += entry.trustDelta * weight;
  }
  return Math.max(-10, Math.min(10, trust));
}

/**
 * Resolves a join condition from derived trust and last run outcome.
 * Used by the World Population Engine pre-run crew availability check.
 */
export function resolveJoinCondition(
  crewId: string,
  trust: number,
  lastOutcome: RunOutcome | "never_shipped",
  survivedDeath: boolean,
): JoinCondition {
  if (lastOutcome === "never_shipped") {
    return { type: "never_shipped", text: "You've heard the name. You find them at the dock." };
  }
  if (survivedDeath || trust < -3) {
    return { type: "refuse", text: _REFUSE_TEXT[crewId] ?? "They look at you and say nothing. Not today." };
  }
  if (trust < 0) {
    return { type: "demand", price: "medicine -10", text: _DEMAND_TEXT[crewId] ?? "They'll go. But they want something first." };
  }
  if (trust < 5) {
    return { type: "neutral", text: _NEUTRAL_TEXT[crewId] ?? "They're at the dock when you arrive. Ready." };
  }
  return { type: "gift", item: "fuel +15", text: _GIFT_TEXT[crewId] ?? "They're there early, with something for you." };
}

// Authored join condition text per crew member — stubs for now
const _REFUSE_TEXT: Record<string, string> = {
  solange:  "She shakes her head. 'Not this time. I watched what happened. I'm not ready.'",
  dr_melo:  "He doesn't look up from his notes. 'I'll go back out there. But not yet. Not with someone I don't know.'",
  raimundo: "He's working on someone else's engine. He doesn't stop. 'Ask me next season.'",
  catarina: "She looks at you for a long time. 'The river remembers what happened. So do I.'",
};

const _DEMAND_TEXT: Record<string, string> = {
  solange:  "'I'll go. But I want proper pay this time — the fuel gauge needs replacing, and that's on you.'",
  dr_melo:  "'I'll come along. But I need field supplies — my reagent stock is gone. Fix that first.'",
  raimundo: "'Sure. But that engine's been running rough since you brought it back. I need parts before I trust it.'",
  catarina: "'I'll go. But you stop where I say we stop. No arguments on the river.'",
};

const _NEUTRAL_TEXT: Record<string, string> = {
  solange:  "She's coiling rope at the stern when you arrive. 'Ready when you are.'",
  dr_melo:  "He's already packed. 'I heard you were going back out. I figured I'd ask.'",
  raimundo: "He's got the engine running before you've finished loading. 'Sounds good. Checked the fuel line.'",
  catarina: "She's at the dock early. 'I know a few people on the upper river. Useful, maybe.'",
};

const _GIFT_TEXT: Record<string, string> = {
  solange:  "She hands you a chart — hand-drawn, from memory. 'Upper channel shifts in dry season. Saved me twice.'",
  dr_melo:  "He's set aside a specimen case for you. 'Found something interesting last week. You should see it.'",
  raimundo: "He sourced fuel from somewhere upstream. 'Figured you'd need it. The Purus has been running low.'",
  catarina: "She's brought a letter from a village elder you helped two runs ago. 'They remember you. That matters.'",
};
