/**
 * Crew Registry
 *
 * Persistent store for crew records. Manages cross-run crew state:
 * availability, relationship history, trust derivation, and join conditions.
 *
 * Initializes from CREW_POOL on first run. Relationship history is accumulated
 * at run end via Codex.recordRun() → CrewRegistry.recordRunEnd().
 */

import type { ArchetypeId } from "@igapo/shared";
import type { RunOutcome } from "@igapo/shared";
import type {
  CrewRecord,
  CrewRegistryStore,
  DerivedCrewState,
  JoinCondition,
} from "@igapo/shared";
import { emptyCrewRegistry, deriveCrewTrust, resolveJoinCondition } from "@igapo/shared";
import { CREW_POOL } from "@igapo/shared";

const REGISTRY_KEY = "varzea_crew_registry_v1";

// ── Persistence ──────────────────────────────────────────────────────────────

export const CrewRegistry = {
  load(): CrewRegistryStore {
    try {
      const raw = localStorage.getItem(REGISTRY_KEY);
      if (raw) return { ...emptyCrewRegistry(), ...JSON.parse(raw) };
    } catch {
      // localStorage unavailable
    }
    // First load: seed from CREW_POOL definitions
    return seedRegistry();
  },

  save(store: CrewRegistryStore) {
    try {
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(store));
    } catch {
      // silent fail
    }
  },

  reset() {
    localStorage.removeItem(REGISTRY_KEY);
  },

  /** Derives current state for all crew relative to a given archetype. */
  deriveAll(archetypeId: ArchetypeId): DerivedCrewState[] {
    const store = this.load();
    return store.records.map((r) => deriveCrewState(r, archetypeId));
  },

  /** Returns crew available for recruitment at the start node. */
  availableAtStart(archetypeId: ArchetypeId): DerivedCrewState[] {
    const store = this.load();
    return store.records
      .filter((r) =>
        (r.currentStatus === "available" || r.currentStatus === "missing") &&
        (r.currentLocationNodeId === "start" || r.currentLocationNodeId === null),
      )
      .map((r) => deriveCrewState(r, archetypeId));
  },

  /**
   * Records run participation for each crew member who sailed.
   * Called from Codex.recordRun() at run end.
   */
  recordRunEnd(
    crewIds: string[],
    archetypeId: ArchetypeId,
    runId: number,
    trustDeltas: Record<string, number>,
    moraleEnds: Record<string, number>,
    outcome: RunOutcome,
    endNodeId: string,
  ) {
    const store = this.load();
    for (const record of store.records) {
      if (!crewIds.includes(record.id)) continue;
      record.relationshipHistory.push({
        runId,
        archetypeId,
        trustDelta: trustDeltas[record.id] ?? 0,
        moraleEnd: moraleEnds[record.id] ?? 80,
        notableEventIds: [],
        runOutcome: outcome,
      });
      // After a death, crew become unavailable for 1–2 runs
      if (outcome === "death") {
        record.currentStatus = "unavailable";
      }
      record.currentLocationNodeId = endNodeId;
    }
    this.save(store);
  },
};

// ── State derivation ─────────────────────────────────────────────────────────

function deriveCrewState(record: CrewRecord, archetypeId: ArchetypeId): DerivedCrewState {
  const trust = deriveCrewTrust(record.relationshipHistory, archetypeId);
  const lastEntry = record.relationshipHistory.at(-1);
  const lastRunOutcome: RunOutcome | "never_shipped" = lastEntry?.runOutcome ?? "never_shipped";
  const survivedDeath = record.relationshipHistory.some((e) => e.runOutcome === "death");
  const timesShipped = record.relationshipHistory.length;

  const sharedExperienceIds: string[] = [];
  const eventCounts: Record<string, number> = {};
  for (const entry of record.relationshipHistory) {
    for (const id of entry.notableEventIds) {
      eventCounts[id] = (eventCounts[id] ?? 0) + 1;
      if (eventCounts[id] >= 2 && !sharedExperienceIds.includes(id)) {
        sharedExperienceIds.push(id);
      }
    }
  }

  const joinCondition: JoinCondition = record.currentStatus === "deceased"
    ? { type: "refuse", text: "They are gone." }
    : record.currentStatus === "unavailable"
      ? { type: "refuse", text: "They're not ready to go back out." }
      : resolveJoinCondition(record.id, trust, lastRunOutcome, survivedDeath);

  return {
    crewId: record.id,
    trust,
    sharedExperienceIds,
    lastRunOutcome,
    timesShippedTogether: timesShipped,
    survivedDeathTogether: survivedDeath,
    joinCondition,
  };
}

// ── Seed from CREW_POOL ──────────────────────────────────────────────────────

function seedRegistry(): CrewRegistryStore {
  const records: CrewRecord[] = CREW_POOL.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    currentStatus: "available" as const,
    currentLocationNodeId: "start",
    traits: c.traits.map((t) => t.id),
    relationshipHistory: [],
  }));
  return { records, version: 1 };
}
