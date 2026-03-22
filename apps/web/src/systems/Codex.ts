import type { FieldNote } from "@igapo/shared";
import { GameState } from "./GameState";

const STORAGE_KEY = "varzea_codex_v1";

// Meta-narrative fragments surfaced across runs
const META_FRAGMENT_TRIGGERS: Record<string, string> = {
  ask_river: "fragment_1",          // traders mention boats not returning
  accept_hospitality: "fragment_2", // elder describes migration change
  ask_research: "fragment_3",       // researcher's sensor buoys gone silent
  ask_quiet_zones: "fragment_4",    // the "quiet zones" named explicitly
  enter_facility: "fragment_5",     // Dr. Carvalho's unfinished journal entry
};

export interface CodexData {
  allNoteIds: string[];            // all field notes ever gained across runs
  totalNotes: number;
  visitedNodeIds: string[];
  metaFragments: string[];         // fragment IDs discovered
  totalRuns: number;
  destinationReached: boolean;
}

function empty(): CodexData {
  return {
    allNoteIds: [],
    totalNotes: 0,
    visitedNodeIds: [],
    metaFragments: [],
    totalRuns: 0,
    destinationReached: false,
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
    // (We track which encounter IDs were visited — fragments fire on specific encounters)
    for (const nodeId of state.visitedNodeIds) {
      const fragment = META_FRAGMENT_TRIGGERS[nodeId];
      if (fragment && !codex.metaFragments.includes(fragment)) {
        codex.metaFragments.push(fragment);
      }
    }

    this.save(codex);
  },

  getNotesSummary(): { id: string; species: string }[] {
    // Returns stub summaries of all ever-unlocked notes
    // Full text lives in encounterData; this is just the persistent record
    const codex = this.load();
    return codex.allNoteIds.map((id) => ({ id, species: id.replace(/_/g, " ") }));
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
