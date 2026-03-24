/**
 * World Population Engine
 *
 * The bridge between history and the present run. Reads the Geography Layer
 * and the Event Log's derived state, evaluates the Encounter Template Library,
 * and produces a RunManifest — the concrete encounter assignment for this run.
 *
 * STUB: Currently wraps the legacy encounterSelector behavior.
 * Full compilation pass (preconditions, rolling window, same-run propagation)
 * to be implemented when the scrolling river view is in place.
 */

import type { DerivedStateSnapshot } from "@igapo/shared";
import type { RunManifest, RunLocalCache, NodeAssignment, SegmentAssignment } from "@igapo/shared";
import type { MissionObjective } from "@igapo/shared";
import type { ArchetypeId } from "@igapo/shared";
import { emptyRunLocalCache } from "@igapo/shared";
import { ENCOUNTERS } from "../data/encounterData";

// ── Compilation input ────────────────────────────────────────────────────────

export interface CompilationInput {
  derivedState: DerivedStateSnapshot;
  archetypeId: ArchetypeId;
  runId: number;
  runCount: number;
  crewManifest: string[];     // crew member IDs joining this run
  missionObjective: MissionObjective | null;
}

// ── Compilation pass (stub) ──────────────────────────────────────────────────

/**
 * Produces a RunManifest for the current run.
 *
 * Stub behavior: creates a shallow manifest from the static 17-node map.
 * Each node gets a placeholder assignment pointing to the legacy encounter IDs.
 * WORLD_STATE_VARIANTS evaluation still happens at encounter-presentation time
 * in EncounterEngine until full pre-compilation is implemented.
 */
export function compile(input: CompilationInput): RunManifest {
  const nodeManifest: NodeAssignment[] = Object.keys(ENCOUNTERS).map((encId) => ({
    nodeId: encId,                 // legacy: nodeId === encounterId in static map
    assignedTemplateId: encId,
    assignedVariantId: "default",  // variant selection still handled by EncounterEngine
    isCompiled: true,
    isMissionObjective: input.missionObjective?.nodeId === encId,
    hasIntelHint: input.missionObjective?.intelNodeIds.includes(encId) ?? false,
    intelHintText: undefined,
  }));

  const segmentManifest: SegmentAssignment[] = []; // populated when river segments exist

  return {
    runId: input.runId,
    compiledAt: Date.now(),
    nodeManifest,
    segmentManifest,
    missionObjectiveNodeId: input.missionObjective?.nodeId ?? "",
    intelNodeIds: input.missionObjective?.intelNodeIds ?? [],
    forkManifests: {},
  };
}

// ── Same-run propagation ─────────────────────────────────────────────────────

/**
 * Applies accumulated run-local effects on top of the base derived state,
 * producing an updated snapshot for rolling window compilation.
 *
 * Stub: returns the base snapshot unchanged until rolling compilation is active.
 */
export function applyRunLocalDelta(
  base: DerivedStateSnapshot,
  cache: RunLocalCache,
): DerivedStateSnapshot {
  if (Object.keys(cache.derivedDelta).length === 0) return base;

  // Deep-clone nodes and apply delta
  const nodes = { ...base.nodes };
  for (const [nodeId, delta] of Object.entries(cache.derivedDelta)) {
    if (!nodes[nodeId]) continue;
    const updated = { ...nodes[nodeId] };
    for (const [attr, value] of Object.entries(delta)) {
      (updated as Record<string, unknown>)[attr] =
        ((updated as Record<string, unknown>)[attr] as number ?? 0) + value;
    }
    nodes[nodeId] = updated;
  }

  return { ...base, nodes };
}

// ── Run local cache ──────────────────────────────────────────────────────────

export { emptyRunLocalCache };

/**
 * Records a node visit in the run-local cache and updates the derived delta
 * for any effects that propagate within the same run.
 */
export function recordVisitInCache(
  cache: RunLocalCache,
  nodeId: string,
): RunLocalCache {
  return {
    ...cache,
    nodeVisits: [...cache.nodeVisits, nodeId],
  };
}

/**
 * Records a choice in the run-local cache.
 * Effects that should propagate same-run are written to derivedDelta.
 */
export function recordChoiceInCache(
  cache: RunLocalCache,
  nodeId: string,
  choiceId: string,
): RunLocalCache {
  return {
    ...cache,
    choicesMade: { ...cache.choicesMade, [nodeId]: choiceId },
  };
}
