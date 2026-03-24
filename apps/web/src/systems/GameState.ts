import type { Resources, CrewMember, FieldNote, Season, TimeOfDay, Weather, Archetype, WorldEvent, DerivedStateSnapshot, RunManifest } from "@igapo/shared";
import { FIELD_NOTES_BY_ID } from "../data/encounterData";
import { Codex } from "./Codex";
import { deriveStateSnapshot } from "./DerivationLayer";

export class GameState {
  resources: Resources;
  // Season is set at run start: alternates wet/dry based on run count, with slight randomness
  season: Season;
  timeOfDay: TimeOfDay = "dawn";
  weather: Weather = "clear";
  dayNumber: number = 1;
  archetypeId: string;
  moveCount: number = 0;

  currentNodeId: string = "start";
  visitedNodeIds: Set<string> = new Set(["start"]);

  fieldNotes: FieldNote[] = [];
  unlockedFieldNoteIds: Set<string> = new Set();

  crew: CrewMember[] = [];
  codexEntries: Set<string> = new Set();

  // ── Archetype unique mechanic state ──────────────────────────────────────
  // Naturalist: Specimen Journal — every 3 wildlife field notes = grant
  specimenCount: number = 0;
  specimenGrantLevel: number = 0; // how many grants have already fired

  // Correspondent: Source Network — radio tips stored per node id
  radioTips: string[] = [];

  // Medic: Clinic Reputation — communities where clinic was run this run
  healedCommunities: Set<string> = new Set();

  // Correspondent: node IDs that have radio intel this run (for map tooltip)
  radioTipNodeIds: Set<string> = new Set();

  // ── World event log ───────────────────────────────────────────────────────
  runId: number = 0;
  runEvents: WorldEvent[] = [];
  derivedState!: DerivedStateSnapshot;
  runManifest!: RunManifest;
  private _nextEventIdx: number = 0;

  constructor(archetype: Archetype) {
    this.archetypeId = archetype.id;
    // Season alternates: even runs = wet (floods high, dolphins upriver), odd runs = dry (sandbanks, piranhas)
    // With a small random override so not perfectly predictable
    const codex = Codex.load();
    const runCount = codex.totalRuns;
    this.season = (runCount % 2 === 0 || Math.random() < 0.25) ? "wet" : "dry";
    this.resources = {
      fuel: archetype.startingResources.fuel ?? 100,
      food: archetype.startingResources.food ?? 100,
      medicine: archetype.startingResources.medicine ?? 60,
      equipment: archetype.startingResources.equipment ?? 100,
      morale: archetype.startingResources.morale ?? 100,
    };
    for (const id of archetype.bonusFieldNoteIds) {
      const note = FIELD_NOTES_BY_ID[id];
      if (note) this.addFieldNote(note);
    }

    // Load world event log and derive full state snapshot for this run
    const eventStore = Codex.loadEvents();
    this.runId = runCount;
    this._nextEventIdx = eventStore.nextEventIndex;
    this.derivedState = deriveStateSnapshot(eventStore.events, this.runId);
  }

  recordEvent(partial: Omit<WorldEvent, "id" | "runId" | "turn">): void {
    const event: WorldEvent = {
      ...partial,
      id: `evt_${String(this._nextEventIdx++).padStart(5, "0")}`,
      runId: this.runId,
      turn: this.moveCount,
    };
    this.runEvents.push(event);
  }

  hasFieldNote(id: string): boolean {
    return this.unlockedFieldNoteIds.has(id);
  }

  addFieldNote(note: FieldNote) {
    if (!this.unlockedFieldNoteIds.has(note.id)) {
      this.fieldNotes.push(note);
      this.unlockedFieldNoteIds.add(note.id);
    }
  }

  visitNode(id: string) {
    this.visitedNodeIds.add(id);
    this.currentNodeId = id;
    this.moveCount++;
    this.recordEvent({
      nodeId: id,
      archetypeId: this.archetypeId,
      eventType: "node_visited",
      effects: [],
      tags: ["node_visited"],
    });
  }

  advanceTime() {
    const cycle: TimeOfDay[] = ["dawn", "morning", "afternoon", "dusk", "night"];
    const idx = cycle.indexOf(this.timeOfDay);
    this.timeOfDay = cycle[(idx + 1) % cycle.length];
    if (this.timeOfDay === "dawn") this.dayNumber++;
    this.tickWeather();
  }

  drainResources(delta: Partial<Resources>) {
    for (const key of Object.keys(delta) as (keyof Resources)[]) {
      this.resources[key] = Math.max(0, this.resources[key] - (delta[key] ?? 0));
    }
  }

  private tickWeather() {
    const roll = Math.random();
    const transitions: Record<Weather, Weather[]> = {
      clear:            roll < 0.15 ? ["cloudy"]           : ["clear"],
      cloudy:           roll < 0.1 ? ["clear"] : roll < 0.25 ? ["storm_approaching"] : ["cloudy"],
      storm_approaching: roll < 0.5  ? ["storm"]            : ["storm_approaching"],
      storm:            roll < 0.4  ? ["cloudy"]           : ["storm"],
    };
    this.weather = transitions[this.weather][0];
  }
}
