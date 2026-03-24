import type { WorldEvent, DerivedNodeState } from "@igapo/shared";

/**
 * Pure function — no side effects, fully testable.
 * Reads raw WorldEvents and produces per-node derived state.
 *
 * currentRunId is the run ID that is *about to start* (i.e. totalRuns at run-start time).
 * It is used to compute how many runs have elapsed since each event, for decay.
 */
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
      };
    }
    return states[nodeId];
  };

  for (const event of events) {
    const s = ensure(event.nodeId);

    if (event.eventType === "node_visited") {
      s.visit_count++;
    }

    for (const effect of event.effects) {
      if (effect.target.type !== "node") continue;
      const target = ensure(effect.target.nodeId);

      if (effect.attribute === "community_trust") {
        // 20% decay per run elapsed since the event
        const runsElapsed = Math.max(0, currentRunId - event.runId);
        const decayed = effect.delta * Math.pow(0.8, runsElapsed);
        target.community_trust += decayed;
      }

      if (effect.attribute === "has_medical_history" && effect.delta > 0) {
        target.has_medical_history = true;
      }
    }
  }

  // Clamp community_trust to [-10, +10]
  for (const s of Object.values(states)) {
    s.community_trust = Math.max(-10, Math.min(10, s.community_trust));
  }

  return states;
}
