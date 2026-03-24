import type { GeographyRegion } from "./geography";

// ── Event tags ───────────────────────────────────────────────────────────────

export type EventTag =
  // Encounter domain
  | "human"
  | "wildlife"
  | "navigation"
  | "discovery"
  | "story"
  // Valence
  | "positive_community"
  | "negative_community"
  | "ecological_harm"
  | "ecological_benefit"
  | "medical"
  | "violent"
  // Context
  | "settlement"
  | "wilderness"
  | "night"
  | "storm"
  | "wet_season"
  | "dry_season"
  // Run lifecycle
  | "node_visited"
  | "node_passed"
  | "run_end"
  | "run_start"
  | "mission_success"
  | "mission_failure"
  | "character_death"
  // Crew
  | "crew_joined"
  | "crew_lost";

// ── World event type ─────────────────────────────────────────────────────────

export type WorldEventType =
  | "encounter_outcome"          // player resolved an encounter
  | "transit_encounter"          // random encounter during river travel
  | "node_visited"               // player arrived at a node
  | "node_passed"                // player saw a node but did not stop
  | "run_start"                  // character began a run
  | "run_end"                    // character ended a run (any outcome)
  | "run_end_success"            // mission completed
  | "run_end_pullout"            // character pulled out; mission failed; alive
  | "run_end_death"              // character died
  | "crew_joined"                // crew member joined this run
  | "crew_lost"                  // crew member died or was left behind
  | "mission_objective_reached"; // player found the mission objective node

// ── World effect ─────────────────────────────────────────────────────────────

export interface WorldEffect {
  target:
    | { type: "node";      nodeId: string }
    | { type: "region";    regionId: GeographyRegion }
    | { type: "character"; characterId: string }
    | { type: "world" };
  attribute: string;
  delta: number;
  /** Human-readable note for the content management GUI. */
  note?: string;
}

// ── World event ──────────────────────────────────────────────────────────────

export interface WorldEvent {
  // Identity
  id: string;
  runId: number;
  turn: number;

  // Location
  nodeId: string;
  /** Region populated at event write time for faster regional queries. */
  regionId?: GeographyRegion;

  // Actor
  archetypeId: string;

  // Event
  eventType: WorldEventType;
  encounterId?: string;
  choiceId?: string;
  outcome?: "success" | "failure" | "neutral";

  // World-state mutations produced by this event
  effects: WorldEffect[];

  // Semantic tags for fast filtering
  tags: string[];
}

// ── Derived node state ───────────────────────────────────────────────────────

export interface DerivedNodeState {
  nodeId: string;
  /** -10 to +10; how locals feel about outsiders. Decays 20%/run. */
  community_trust: number;
  /** Total visits across all runs. No decay. */
  visit_count: number;
  /** True if medical aid was provided at this node in any prior run. */
  has_medical_history: boolean;
  /** 0 to +10; habitat quality from respectful wildlife observation. Decays 20%/run. */
  ecological_health: number;
  /** 0 to +10; cumulative resource extraction pressure. No decay — damage is permanent. */
  extraction_level: number;
  /** Archetype ID of the most recent character to visit this node. */
  last_archetype_visited: string | null;
  /** Run ID of the most recent visit. */
  last_run_visited: number | null;
  /** True if this node was a mission objective in any prior run. */
  is_mission_objective_history: boolean;
}

// ── Derived region state ─────────────────────────────────────────────────────

export interface DerivedRegionState {
  regionId: GeographyRegion;
  /** -5 to +5; aggregate regional attitude toward outsiders. Decays 10%/run. */
  outsider_disposition: number;
  /** -3 to +3; reputation of medical workers in this region. Decays 15%/run. */
  medic_reputation: number;
  /** 0 to +10; cumulative environmental harm across the region. No decay. */
  ecological_pressure: number;
  /** True if violent event occurred in this region in the last 2 runs. */
  recent_violence: boolean;
  /** Most common archetype to pass through this region. */
  dominant_archetype_history: string | null;
}

// ── Derived world state ──────────────────────────────────────────────────────

export interface DerivedWorldState {
  totalRuns: number;
  totalCharactersDied: number;
  totalMissionsCompleted: number;
  totalMissionsFailed: number;
  zonaFragmentsFound: number;
}

// ── Full derived state snapshot ──────────────────────────────────────────────

/**
 * Produced by the Derivation Layer at run start.
 * The World Population Engine and EncounterEngine read from this.
 */
export interface DerivedStateSnapshot {
  nodes: Record<string, DerivedNodeState>;
  regions: Record<string, DerivedRegionState>;
  world: DerivedWorldState;
}
