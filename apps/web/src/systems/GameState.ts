import type { Resources, CrewMember, RiverNode, FieldNote, Season, TimeOfDay } from "@igapo/shared";

/**
 * Central game state for a single run.
 * All mutable state lives here; systems read/write via this object.
 */
export class GameState {
  // Resources
  resources: Resources = {
    fuel: 100,
    food: 100,
    medicine: 60,
    equipment: 100,
    morale: 100,
  };

  // Expedition context
  season: Season = "wet";
  timeOfDay: TimeOfDay = "dawn";
  dayNumber: number = 1;

  // Navigation
  currentNodeId: string = "start";
  visitedNodeIds: Set<string> = new Set(["start"]);
  revealedNodeIds: Set<string> = new Set(["start"]);

  // Knowledge
  fieldNotes: FieldNote[] = [];
  unlockedFieldNoteIds: Set<string> = new Set();

  // Crew
  crew: CrewMember[] = [];

  // Meta (persists across runs — loaded from save)
  codexEntries: Set<string> = new Set();

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
  }

  revealNode(id: string) {
    this.revealedNodeIds.add(id);
  }

  advanceTime() {
    const cycle: TimeOfDay[] = ["dawn", "morning", "afternoon", "dusk", "night"];
    const idx = cycle.indexOf(this.timeOfDay);
    this.timeOfDay = cycle[(idx + 1) % cycle.length];
    if (this.timeOfDay === "dawn") this.dayNumber++;
  }

  drainResources(delta: Partial<Resources>) {
    for (const key of Object.keys(delta) as (keyof Resources)[]) {
      this.resources[key] = Math.max(0, this.resources[key] - (delta[key] ?? 0));
    }
  }
}
