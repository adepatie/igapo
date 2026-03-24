/**
 * Run Manifest
 *
 * The pre-compiled encounter assignment for a specific run, produced by the
 * World Population Engine. Drives what the player encounters during play.
 * Persisted in the run state so save/restore produces identical sequences.
 */

import type { WorldEffect } from "./events";

// ── Node assignment ──────────────────────────────────────────────────────────

export interface NodeAssignment {
  nodeId: string;
  assignedTemplateId: string;   // which encounter template was selected
  assignedVariantId: string;    // which variant was selected
  isCompiled: boolean;          // false until this node enters the rolling window
  isMissionObjective: boolean;  // hidden flag — EncounterEngine fires mission resolution
  hasIntelHint: boolean;        // should this node inject an intel hint
  intelHintText?: string;       // authored hint text if hasIntelHint
}

// ── Segment assignment ───────────────────────────────────────────────────────

export interface WeightedEncounterEntry {
  templateId: string;
  weight: number;
  maxPerRun?: number;           // cap for one-time encounters
}

export interface SegmentAssignment {
  segmentId: string;
  encounterTable: WeightedEncounterEntry[];
  baseEncounterRate: number;    // rolls per abstract unit of travel
}

// ── Run manifest ─────────────────────────────────────────────────────────────

export interface RunManifest {
  runId: number;
  compiledAt: number;           // timestamp — used to detect stale manifests
  nodeManifest: NodeAssignment[];
  segmentManifest: SegmentAssignment[];
  missionObjectiveNodeId: string;
  intelNodeIds: string[];
  /** Sub-manifests for fork branches; compiled lazily when player approaches fork. */
  forkManifests: Record<string, RunManifest>;
}

// ── Run-local state cache ────────────────────────────────────────────────────

/**
 * Ephemeral state accumulated during a run.
 * Drives same-run propagation: effects produced early in the run can influence
 * encounter selection at nodes compiled later (rolling window).
 * Discarded at run end; effects are committed to the persistent Event Log.
 */
export interface RunLocalCache {
  runId: number;
  nodeVisits: string[];                      // ordered list of visited nodeIds
  passedNodeIds: string[];                   // nodes the player saw but skipped
  choicesMade: Record<string, string>;       // nodeId → choiceId
  effectsAccumulated: WorldEffect[];         // world effects produced so far
  /** Derived attribute deltas to overlay on the base snapshot for rolling compilation. */
  derivedDelta: Record<string, Record<string, number>>;  // nodeId → { attribute → delta }
  firedTransitEncounterIds: string[];        // one-time transit encounters already fired
  crewAlertsFired: Set<string>;             // resource-threshold alerts already shown
}

export function emptyRunLocalCache(runId: number): RunLocalCache {
  return {
    runId,
    nodeVisits: [],
    passedNodeIds: [],
    choicesMade: {},
    effectsAccumulated: [],
    derivedDelta: {},
    firedTransitEncounterIds: [],
    crewAlertsFired: new Set(),
  };
}

// ── River movement state ─────────────────────────────────────────────────────

/**
 * State machine for the scrolling river view.
 * Used by the future MapScene/RiverView implementation.
 */
export type RiverMovementState =
  | "TRAVELING"     // river scrolling; player in transit
  | "APPROACHING"   // hub node visible ahead; synopsis prompt shown
  | "STOPPED"       // at a shore hub; encounter UI active
  | "INTERRUPTED";  // transit random encounter fired; river paused
