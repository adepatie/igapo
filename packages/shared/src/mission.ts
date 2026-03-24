/**
 * Mission System
 *
 * Every run begins with a telegram that establishes why this character is on
 * the river. The mission gives the endless river a specific shape for this run.
 * The player does not see a map marker — they travel until the world reveals
 * the objective.
 */

import type { ArchetypeId } from "./types";

// ── Mission types per archetype ──────────────────────────────────────────────

export type MissionType =
  // Medic
  | "sick_village"
  | "injured_traveler"
  | "epidemic_source"
  // Naturalist
  | "specimen_collection"
  | "habitat_survey"
  | "migration_tracking"
  // Correspondent
  | "find_source"
  | "document_incident"
  | "verify_rumor"
  // River Guide
  | "navigation_survey"
  | "rescue_operation"
  | "route_assessment";

export type RunOutcome =
  | "success"    // mission completed
  | "pullout"    // character pulled out alive; mission failed
  | "death";     // character died

// ── Telegram template ────────────────────────────────────────────────────────

/**
 * Conditional inline text inserted into telegram body based on world state.
 */
export interface HistoricalReference {
  /** Placeholder in bodyText, e.g. "{{prior_failure_note}}" */
  insertionPoint: string;
  /** World-state condition that must be true for this text to be inserted.
   *  Expressed as a simple attribute check for now; full Precondition system later. */
  condition: { attribute: string; op: "gt" | "gte" | "eq"; value: number | string | boolean };
  text: string;
}

export interface TelegramTemplate {
  id: string;
  archetypeId: ArchetypeId;
  missionType: MissionType;
  sender: string;
  subject: string;
  /** Full telegram body text; may contain {{placeholder}} tokens. */
  bodyText: string;
  historicalReferences?: HistoricalReference[];
}

// ── Direction hints ──────────────────────────────────────────────────────────

export interface DirectionHint {
  nodeId: string;           // where this hint is delivered
  hintText: string;         // vague directional (e.g. "upstream from the black water")
  hintSource: string;       // who delivers it (trader, villager, crew member)
  requiresStop: boolean;    // true → only delivered if player stops here
}

// ── Mission objective ────────────────────────────────────────────────────────

export interface MissionObjective {
  nodeId: string;
  missionType: MissionType;
  telegramId: string;
  intelNodeIds: string[];
  directionHints: DirectionHint[];
}

// ── Run history entry ────────────────────────────────────────────────────────

/**
 * Written to the event log at run end. Provides the mission system
 * with data for telegram historical references in future runs.
 */
export interface RunHistoryEntry {
  runId: number;
  archetypeId: ArchetypeId;
  missionType: MissionType;
  objectiveNodeId: string;
  outcome: RunOutcome;
  turnsCompleted: number;
}

// ── Telegram pool (stub — content authored in MissionSystem.ts) ──────────────

/** Selects a telegram for a run given archetype and world state. Stub — returns null until content is authored. */
export type TelegramSelector = (
  archetypeId: ArchetypeId,
  runHistory: RunHistoryEntry[],
) => TelegramTemplate | null;
