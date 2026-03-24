import type { FieldNote, WorldEvent, ArchetypeId, RunOutcome } from "@igapo/shared";
import { GameState } from "./GameState";
import { CrewRegistry } from "./CrewRegistry";

const STORAGE_KEY = "varzea_codex_v1";
const EVENTS_KEY = "varzea_events_v1";

interface EventLogStore {
  events: WorldEvent[];
  nextEventIndex: number;
}

function emptyEventLog(): EventLogStore {
  return { events: [], nextEventIndex: 0 };
}

// Meta-narrative fragments triggered by specific encounter choice IDs
// These are choice IDs (tracked in state.codexEntries), not node IDs
const META_FRAGMENT_TRIGGERS: Record<string, string> = {
  ask_river:          "fragment_1", // trader mentions boats not returning
  accept_hospitality: "fragment_2", // elder describes migration change
  ask_research:       "fragment_3", // researcher's sensor buoys gone silent
  ask_quiet_zones:    "fragment_4", // the "quiet zones" named explicitly
  enter_facility:     "fragment_5", // Dr. Carvalho's unfinished journal entry
  trader_trade:       "fragment_6", // map with researcher's name on it
  challenge:          "fragment_7", // illegal concession zone number
  report_findings:    "fragment_8", // reaching the destination, told "go in"
};

export interface CodexData {
  allNoteIds: string[];
  totalNotes: number;
  visitedNodeIds: string[];
  metaFragments: string[];
  totalRuns: number;
  destinationReached: boolean;

  // Archetype mechanic career stats
  naturalistSpecimenBest: number;     // highest single-run specimen count
  naturalistGrantsTotal: number;      // total grants received across all runs
  medicClinicRunsTotal: number;       // total clinic encounters run across all runs
  medicHealedCommunities: string[];   // unique community node IDs healed (cross-run)
  correspondentTipsTotal: number;     // total radio tips generated across all runs
}

function empty(): CodexData {
  return {
    allNoteIds: [],
    totalNotes: 0,
    visitedNodeIds: [],
    metaFragments: [],
    totalRuns: 0,
    destinationReached: false,
    naturalistSpecimenBest: 0,
    naturalistGrantsTotal: 0,
    medicClinicRunsTotal: 0,
    medicHealedCommunities: [],
    correspondentTipsTotal: 0,
  };
}

export const Codex = {
  load(): CodexData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
    } catch {
      return empty();
    }
  },

  save(data: CodexData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable — silent fail, not game-breaking
    }
  },

  recordRun(state: GameState) {
    const codex = this.load();

    codex.totalRuns++;
    if (state.currentNodeId === "destination") codex.destinationReached = true;

    // Merge field notes
    for (const note of state.fieldNotes) {
      if (!codex.allNoteIds.includes(note.id)) {
        codex.allNoteIds.push(note.id);
      }
    }
    codex.totalNotes = codex.allNoteIds.length;

    // Merge visited nodes
    for (const id of state.visitedNodeIds) {
      if (!codex.visitedNodeIds.includes(id)) {
        codex.visitedNodeIds.push(id);
      }
    }

    // Surface meta fragments based on choices made this run
    // state.codexEntries tracks encounter choice IDs resolved this run
    for (const choiceId of state.codexEntries) {
      const fragment = META_FRAGMENT_TRIGGERS[choiceId];
      if (fragment && !codex.metaFragments.includes(fragment)) {
        codex.metaFragments.push(fragment);
      }
    }

    // ── Archetype mechanic career stats ──────────────────────────────────
    if (state.archetypeId === "naturalist") {
      if (state.specimenCount > codex.naturalistSpecimenBest) {
        codex.naturalistSpecimenBest = state.specimenCount;
      }
      codex.naturalistGrantsTotal += state.specimenGrantLevel;
    }

    if (state.archetypeId === "medic") {
      codex.medicClinicRunsTotal += state.healedCommunities.size;
      for (const communityId of state.healedCommunities) {
        if (!codex.medicHealedCommunities.includes(communityId)) {
          codex.medicHealedCommunities.push(communityId);
        }
      }
    }

    if (state.archetypeId === "correspondent") {
      codex.correspondentTipsTotal += state.radioTips.length;
    }

    this.save(codex);

    // Write the terminal run_end event, then append all run events to the persistent log
    state.recordEvent({
      nodeId: state.currentNodeId,
      archetypeId: state.archetypeId,
      eventType: "run_end",
      effects: [],
      tags: ["run_end"],
    });
    this.appendEvents(state.runEvents);

    // Persist crew relationship history for this run
    const outcome: RunOutcome = state.currentNodeId === "destination" ? "success" : "pullout";
    const moraleEnds: Record<string, number> = {};
    for (const m of state.crew) moraleEnds[m.id] = state.resources.morale;
    CrewRegistry.recordRunEnd(
      state.crew.map((m) => m.id),
      state.archetypeId as ArchetypeId,
      state.runId,
      {}, // trustDeltas — per-crew trust tracking not yet wired
      moraleEnds,
      outcome,
      state.currentNodeId,
    );
  },

  getNotesSummary(): { id: string; species: string }[] {
    const codex = this.load();
    return codex.allNoteIds.map((id) => ({ id, species: id.replace(/_/g, " ") }));
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
  },

  loadEvents(): EventLogStore {
    try {
      const raw = localStorage.getItem(EVENTS_KEY);
      return raw ? { ...emptyEventLog(), ...JSON.parse(raw) } : emptyEventLog();
    } catch {
      return emptyEventLog();
    }
  },

  appendEvents(newEvents: WorldEvent[]) {
    if (newEvents.length === 0) return;
    try {
      const store = this.loadEvents();
      store.events.push(...newEvents);
      store.nextEventIndex += newEvents.length;
      localStorage.setItem(EVENTS_KEY, JSON.stringify(store));
    } catch {
      // localStorage unavailable — silent fail
    }
  },

  resetEvents() {
    localStorage.removeItem(EVENTS_KEY);
  },
};

// Re-export FieldNote to satisfy any callers that import it from here
export type { FieldNote };
