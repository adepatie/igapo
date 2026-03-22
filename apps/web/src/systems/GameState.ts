import type { Resources, CrewMember, FieldNote, Season, TimeOfDay, Weather, Archetype } from "@igapo/shared";
import { FIELD_NOTES_BY_ID } from "../data/encounterData";

export class GameState {
  resources: Resources;
  season: Season = "wet";
  timeOfDay: TimeOfDay = "dawn";
  weather: Weather = "clear";
  dayNumber: number = 1;
  archetypeId: string;
  moveCount: number = 0;

  currentNodeId: string = "start";
  visitedNodeIds: Set<string> = new Set(["start"]);
  revealedNodeIds: Set<string> = new Set(["start"]);

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

  constructor(archetype: Archetype) {
    this.archetypeId = archetype.id;
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
  }

  revealNode(id: string) {
    this.revealedNodeIds.add(id);
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
      cloudy:           roll < 0.25 ? ["storm_approaching"] : roll < 0.1 ? ["clear"] : ["cloudy"],
      storm_approaching: roll < 0.5  ? ["storm"]            : ["storm_approaching"],
      storm:            roll < 0.4  ? ["cloudy"]           : ["storm"],
    };
    this.weather = transitions[this.weather][0];
  }
}
