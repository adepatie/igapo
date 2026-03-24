import { describe, it, expect } from "vitest";
import { deriveNodeStates } from "../systems/DerivationLayer";
import type { WorldEvent } from "@igapo/shared";

function makeEvent(overrides: Partial<WorldEvent> = {}): WorldEvent {
  return {
    id: "evt_00000",
    runId: 0,
    turn: 1,
    nodeId: "node_a",
    archetypeId: "medic",
    eventType: "encounter_outcome",
    effects: [],
    tags: [],
    ...overrides,
  };
}

describe("deriveNodeStates", () => {
  it("returns empty object for empty event log", () => {
    const result = deriveNodeStates([], 0);
    expect(result).toEqual({});
  });

  it("counts node_visited events as visit_count", () => {
    const events: WorldEvent[] = [
      makeEvent({ eventType: "node_visited", nodeId: "node_a" }),
      makeEvent({ eventType: "node_visited", nodeId: "node_a" }),
      makeEvent({ eventType: "node_visited", nodeId: "node_b" }),
    ];
    const result = deriveNodeStates(events, 1);
    expect(result["node_a"].visit_count).toBe(2);
    expect(result["node_b"].visit_count).toBe(1);
  });

  it("sets has_medical_history when has_medical_history effect delta > 0", () => {
    const events: WorldEvent[] = [
      makeEvent({
        nodeId: "node_a",
        effects: [
          { target: { type: "node", nodeId: "node_a" }, attribute: "has_medical_history", delta: 1 },
        ],
      }),
    ];
    const result = deriveNodeStates(events, 1);
    expect(result["node_a"].has_medical_history).toBe(true);
  });

  it("has_medical_history stays true across multiple events (idempotent)", () => {
    const events: WorldEvent[] = [
      makeEvent({
        effects: [{ target: { type: "node", nodeId: "node_a" }, attribute: "has_medical_history", delta: 1 }],
      }),
      makeEvent({
        effects: [{ target: { type: "node", nodeId: "node_a" }, attribute: "has_medical_history", delta: 1 }],
      }),
    ];
    const result = deriveNodeStates(events, 1);
    expect(result["node_a"].has_medical_history).toBe(true);
  });

  it("has_medical_history is false when no medical effects", () => {
    const events: WorldEvent[] = [
      makeEvent({ eventType: "node_visited" }),
    ];
    const result = deriveNodeStates(events, 1);
    expect(result["node_a"].has_medical_history).toBe(false);
  });

  it("accumulates community_trust across two events at the same node", () => {
    const events: WorldEvent[] = [
      makeEvent({
        runId: 0,
        effects: [{ target: { type: "node", nodeId: "node_a" }, attribute: "community_trust", delta: 3 }],
      }),
      makeEvent({
        runId: 0,
        effects: [{ target: { type: "node", nodeId: "node_a" }, attribute: "community_trust", delta: 2 }],
      }),
    ];
    // currentRunId = 0 → no decay (runsElapsed = 0, 0.8^0 = 1.0)
    const result = deriveNodeStates(events, 0);
    expect(result["node_a"].community_trust).toBeCloseTo(5, 5);
  });

  it("applies 20% decay per run elapsed for community_trust", () => {
    const events: WorldEvent[] = [
      makeEvent({
        runId: 0,
        effects: [{ target: { type: "node", nodeId: "node_a" }, attribute: "community_trust", delta: 10 }],
      }),
    ];
    // currentRunId = 3 → runsElapsed = 3 → 0.8^3 = 0.512
    const result = deriveNodeStates(events, 3);
    expect(result["node_a"].community_trust).toBeCloseTo(10 * Math.pow(0.8, 3), 5);
  });

  it("clamps community_trust to +10 maximum", () => {
    const events: WorldEvent[] = [
      makeEvent({
        runId: 0,
        effects: [{ target: { type: "node", nodeId: "node_a" }, attribute: "community_trust", delta: 100 }],
      }),
    ];
    const result = deriveNodeStates(events, 0);
    expect(result["node_a"].community_trust).toBe(10);
  });

  it("clamps community_trust to -10 minimum", () => {
    const events: WorldEvent[] = [
      makeEvent({
        runId: 0,
        effects: [{ target: { type: "node", nodeId: "node_a" }, attribute: "community_trust", delta: -100 }],
      }),
    ];
    const result = deriveNodeStates(events, 0);
    expect(result["node_a"].community_trust).toBe(-10);
  });

  it("events at different nodes do not cross-contaminate", () => {
    const events: WorldEvent[] = [
      makeEvent({
        nodeId: "node_a",
        effects: [{ target: { type: "node", nodeId: "node_a" }, attribute: "has_medical_history", delta: 1 }],
      }),
    ];
    const result = deriveNodeStates(events, 0);
    expect(result["node_b"]).toBeUndefined();
    expect(result["node_a"].has_medical_history).toBe(true);
  });

  it("ignores region-scoped effects when computing node state", () => {
    const events: WorldEvent[] = [
      makeEvent({
        effects: [{ target: { type: "region", regionId: "varzea" }, attribute: "outsider_disposition", delta: 5 }],
      }),
    ];
    const result = deriveNodeStates(events, 0);
    // node_a gets created with defaults from the event's nodeId, but no region effect on it
    expect(result["node_a"]?.community_trust ?? 0).toBeCloseTo(0, 5);
  });
});
