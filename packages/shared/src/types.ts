// ── Resources ──────────────────────────────────────────────────────────────

export interface Resources {
  fuel: number;       // 0–100
  food: number;       // 0–100
  medicine: number;   // 0–100
  equipment: number;  // 0–100 (overall condition)
  morale: number;     // 0–100
}

// ── Time ───────────────────────────────────────────────────────────────────

export type Season = "wet" | "dry";
export type TimeOfDay = "dawn" | "morning" | "afternoon" | "dusk" | "night";
export type Weather = "clear" | "cloudy" | "storm_approaching" | "storm";

// ── River Map ──────────────────────────────────────────────────────────────

export type NodeType =
  | "town"
  | "settlement"
  | "wildlife"
  | "discovery"
  | "navigation"
  | "story";

export type Region = "várzea" | "igapó" | "terra_firme";

export interface EncounterPoolEntry {
  encounterId: string;
  conditions?: {
    timeOfDay?: TimeOfDay[];   // only available at these times
    season?: Season[];         // only available in these seasons
    weather?: Weather[];       // only available in this weather
    minRun?: number;           // only after N total runs (meta-unlock)
  };
  weight?: number;             // relative probability (default 1)
}

export interface RiverNode {
  id: string;
  name: string;
  type: NodeType;
  region: Region;
  x: number;
  y: number;
  encounterId: string;                // primary / fallback
  encounterPool?: EncounterPoolEntry[]; // time/season/weather variants
  hint?: string;                      // partial info visible before visit
}

export interface RiverEdge {
  from: string;
  to: string;
}

// ── Encounters ─────────────────────────────────────────────────────────────

export type EncounterType = "wildlife" | "human" | "navigation" | "discovery" | "story";

export interface EncounterChoice {
  id: string;
  label: string;
  requiresFieldNote?: string;   // Field note ID needed to unlock this choice
  successChance?: number;       // 0.0–1.0; undefined = guaranteed
}

export interface EncounterOutcome {
  text: string;
  resourceDelta?: Partial<Resources>;
  fieldNote?: FieldNote;
  codesxEntry?: string;         // Codex ID to unlock
}

export interface EncounterNode {
  id: string;
  title: string;
  type: EncounterType;
  arrivalText: string;
  choices: EncounterChoice[];
}

// ── Field Notes ────────────────────────────────────────────────────────────

export interface FieldNote {
  id: string;
  species: string;
  text: string;
}

// ── Crew ───────────────────────────────────────────────────────────────────

export interface CrewTrait {
  id: string;
  label: string;
  description: string;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  traits: [CrewTrait, CrewTrait];
  morale: number; // 0–100, individual
}

// ── Archetypes ─────────────────────────────────────────────────────────────

export type ArchetypeId = "naturalist" | "correspondent" | "river_guide" | "medic";

export interface Archetype {
  id: ArchetypeId;
  name: string;
  background: string;
  startingResources: Partial<Resources>;
  bonusFieldNoteIds: string[];
}

// ── Codex / Meta ───────────────────────────────────────────────────────────

export interface CodexEntry {
  id: string;
  category: "species" | "place" | "person" | "fragment";
  title: string;
  body: string;
  unlockedAt?: string; // Field note or encounter that triggers this
}
