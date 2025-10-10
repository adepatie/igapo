export * from "@igapo/shared";

export interface GameState {
  playerName: string;
  location: string;
  biome: string;
  morale: number;
  stamina: number;
  supplies: number;
  daysElapsed: number;
  status: "active" | "success" | "failure";
  journal: Array<{
    day: number;
    event: string;
  }>;
}

export interface Action {
  id: string;
  label: string;
  description?: string;
  deltas?: {
    morale?: number;
    stamina?: number;
    supplies?: number;
  };
}

export interface Encounter {
  type: string;
  description: string;
  difficulty?: number;
}

export interface TurnContext {
  stateSummary: {
    location: string;
    biome: string;
    morale: number;
    stamina: number;
    supplies: number;
    daysElapsed: number;
    status: string;
  };
  encounter?: Encounter;
  action?: Action;
}

export interface Narrative {
  summary: string;
  paragraphs: string[];
  mood?: import("@igapo/shared").OutcomeMood;
}

// API Response types
export interface StartResponse {
  state: GameState;
}

export interface ActionResponse {
  state: GameState;
  context: TurnContext;
}

export interface NarrateResponse {
  narrative: Narrative;
}

export interface ViewModel {
  banner: {
    title: string;
    subtitle: string;
    mood: import("@igapo/shared").OutcomeMood;
  };
  narrative: string[];
  choices: Array<Action & { index: number }>;
  facts: string[];
  journal: Array<{ day: number; event: string }>;
  stats: {
    morale: number;
    stamina: number;
    supplies: number;
  };
}
