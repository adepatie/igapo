import type {
  WorldEvent,
  DerivedNodeState,
  DerivedRegionState,
  DerivedWorldState,
  DerivedStateSnapshot,
} from "@igapo/shared";
import type { GeographyRegion } from "@igapo/shared";

/**
 * Pure function — no side effects, fully testable.
 *
 * Reads raw WorldEvents and produces the full DerivedStateSnapshot:
 * per-node attributes, per-region attributes, and global world attributes.
 *
 * currentRunId is the run ID that is *about to start* (i.e. totalRuns at
 * run-start time). Used to compute decay for time-sensitive attributes.
 */
export function deriveStateSnapshot(
  events: WorldEvent[],
  currentRunId: number,
): DerivedStateSnapshot {
  return {
    nodes:  deriveNodeStates(events, currentRunId),
    regions: deriveRegionStates(events, currentRunId),
    world:  deriveWorldState(events),
  };
}

// ── Node derivation ──────────────────────────────────────────────────────────

export function deriveNodeStates(
  events: WorldEvent[],
  currentRunId: number,
): Record<string, DerivedNodeState> {
  const states: Record<string, DerivedNodeState> = {};

  const ensure = (nodeId: string): DerivedNodeState => {
    if (!states[nodeId]) {
      states[nodeId] = {
        nodeId,
        community_trust: 0,
        visit_count: 0,
        has_medical_history: false,
        ecological_health: 0,
        extraction_level: 0,
        last_archetype_visited: null,
        last_run_visited: null,
        is_mission_objective_history: false,
      };
    }
    return states[nodeId];
  };

  for (const event of events) {
    const s = ensure(event.nodeId);

    if (event.eventType === "node_visited") {
      s.visit_count++;
      s.last_archetype_visited = event.archetypeId;
      s.last_run_visited = event.runId;
    }

    if (event.eventType === "mission_objective_reached") {
      s.is_mission_objective_history = true;
    }

    for (const effect of event.effects) {
      if (effect.target.type !== "node") continue;
      const target = ensure(effect.target.nodeId);
      const runsElapsed = Math.max(0, currentRunId - event.runId);

      switch (effect.attribute) {
        case "community_trust": {
          // 20% decay per run
          target.community_trust += effect.delta * Math.pow(0.8, runsElapsed);
          break;
        }
        case "has_medical_history": {
          if (effect.delta > 0) target.has_medical_history = true;
          break;
        }
        case "ecological_health": {
          // 20% decay per run
          target.ecological_health += effect.delta * Math.pow(0.8, runsElapsed);
          break;
        }
        case "extraction_level": {
          // No decay — environmental damage is permanent
          target.extraction_level += effect.delta;
          break;
        }
        case "is_mission_objective_history": {
          if (effect.delta > 0) target.is_mission_objective_history = true;
          break;
        }
      }
    }
  }

  // Clamp derived numerics
  for (const s of Object.values(states)) {
    s.community_trust  = Math.max(-10, Math.min(10, s.community_trust));
    s.ecological_health = Math.max(0,  Math.min(10, s.ecological_health));
    s.extraction_level  = Math.max(0,  Math.min(10, s.extraction_level));
  }

  return states;
}

// ── Region derivation ────────────────────────────────────────────────────────

export function deriveRegionStates(
  events: WorldEvent[],
  currentRunId: number,
): Record<string, DerivedRegionState> {
  const states: Record<string, DerivedRegionState> = {};

  const ensure = (regionId: GeographyRegion): DerivedRegionState => {
    if (!states[regionId]) {
      states[regionId] = {
        regionId,
        outsider_disposition: 0,
        medic_reputation: 0,
        ecological_pressure: 0,
        recent_violence: false,
        dominant_archetype_history: null,
      };
    }
    return states[regionId];
  };

  // Track archetype frequency per region for dominant_archetype
  const archetypeCounts: Record<string, Record<string, number>> = {};

  for (const event of events) {
    const regionId = event.regionId;
    if (!regionId) continue;

    const s = ensure(regionId as GeographyRegion);
    const runsElapsed = Math.max(0, currentRunId - event.runId);

    // Track archetype presence
    if (!archetypeCounts[regionId]) archetypeCounts[regionId] = {};
    archetypeCounts[regionId][event.archetypeId] =
      (archetypeCounts[regionId][event.archetypeId] ?? 0) + 1;

    // Recent violence resets after 2 runs
    if (event.tags.includes("violent") && runsElapsed <= 2) {
      s.recent_violence = true;
    }

    for (const effect of event.effects) {
      if (effect.target.type !== "region") continue;
      const target = ensure(effect.target.regionId as GeographyRegion);

      switch (effect.attribute) {
        case "outsider_disposition":
          // 10% decay per run
          target.outsider_disposition += effect.delta * Math.pow(0.9, runsElapsed);
          break;
        case "medic_reputation":
          // 15% decay per run
          target.medic_reputation += effect.delta * Math.pow(0.85, runsElapsed);
          break;
        case "ecological_pressure":
          // No decay — cumulative harm persists
          target.ecological_pressure += effect.delta;
          break;
      }
    }
  }

  // Resolve dominant archetype per region
  for (const [regionId, counts] of Object.entries(archetypeCounts)) {
    const r = states[regionId];
    if (!r) continue;
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (dominant) r.dominant_archetype_history = dominant[0];
  }

  // Clamp
  for (const s of Object.values(states)) {
    s.outsider_disposition = Math.max(-5, Math.min(5, s.outsider_disposition));
    s.medic_reputation     = Math.max(-3, Math.min(3, s.medic_reputation));
    s.ecological_pressure  = Math.max(0,  Math.min(10, s.ecological_pressure));
  }

  return states;
}

// ── World derivation ─────────────────────────────────────────────────────────

export function deriveWorldState(events: WorldEvent[]): DerivedWorldState {
  let totalRuns = 0;
  let totalCharactersDied = 0;
  let totalMissionsCompleted = 0;
  let totalMissionsFailed = 0;
  let zonaFragmentsFound = 0;

  for (const event of events) {
    if (event.eventType === "run_end_success") totalMissionsCompleted++;
    if (event.eventType === "run_end_pullout") totalMissionsFailed++;
    if (event.eventType === "run_end_death")  { totalCharactersDied++; totalMissionsFailed++; }
    if (event.eventType === "run_end" || event.eventType === "run_end_success" ||
        event.eventType === "run_end_pullout" || event.eventType === "run_end_death") {
      totalRuns++;
    }
    if (event.tags.includes("story") && event.encounterId?.startsWith("fragment_")) {
      zonaFragmentsFound++;
    }
  }

  return { totalRuns, totalCharactersDied, totalMissionsCompleted, totalMissionsFailed, zonaFragmentsFound };
}
