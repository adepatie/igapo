/**
 * World Population Engine
 *
 * The bridge between history and the present run. Reads the Geography Layer
 * and the Event Log's derived state, evaluates the Encounter Template Library,
 * and produces a RunManifest — the concrete encounter assignment for this run.
 *
 * Pre-compiles encounter variant selection at run start using derived world state.
 * Rolling window same-run propagation deferred to a future pass.
 */

import type { DerivedStateSnapshot, RiverNode } from "@igapo/shared";
import type { RunManifest, RunLocalCache, NodeAssignment, SegmentAssignment } from "@igapo/shared";
import type { MissionObjective } from "@igapo/shared";
import type { ArchetypeId } from "@igapo/shared";
import { emptyRunLocalCache } from "@igapo/shared";
import { resolveEncounterVariant } from "../data/encounterData";

// ── Compilation input ────────────────────────────────────────────────────────

export interface CompilationInput {
  derivedState: DerivedStateSnapshot;
  archetypeId: ArchetypeId;
  runId: number;
  runCount: number;
  crewManifest: string[];     // crew member IDs joining this run
  missionObjective: MissionObjective | null;
  /** Run map nodes — required to correctly map node IDs to encounter template IDs. */
  runNodes: RiverNode[];
}

// ── Compilation pass ─────────────────────────────────────────────────────────

/**
 * Produces a RunManifest for the current run.
 *
 * Evaluates WORLD_STATE_VARIANTS conditions against the derived world state for
 * each node, pre-compiling the encounter variant selection. EncounterEngine reads
 * the assignedVariantId from the manifest rather than re-evaluating conditions
 * at encounter-presentation time.
 */
export function compile(input: CompilationInput): RunManifest {
  // Keyed by map node ID. derivedState.nodes is also keyed by map node ID,
  // so lookups match correctly. EncounterEngine uses currentNodeId (map node ID)
  // to retrieve assignments, and assignedTemplateId guards against pool selection.
  const nodeManifest: NodeAssignment[] = input.runNodes.map((node) => {
    const nodeState = input.derivedState.nodes[node.id];
    const assignedVariantId = resolveEncounterVariant(node.encounterId, nodeState);
    return {
      nodeId: node.id,                     // map node ID — matches state.currentNodeId
      assignedTemplateId: node.encounterId, // primary encounter template this was compiled for
      assignedVariantId,
      isCompiled: true,
      isMissionObjective: input.missionObjective?.nodeId === node.id,
      hasIntelHint: input.missionObjective?.intelNodeIds.includes(node.id) ?? false,
      intelHintText: undefined,
    };
  });

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
