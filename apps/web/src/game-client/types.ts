export * from "@igapo/shared";

export interface GameState {
  playerName: string;
  location: string;
  biome: string;
  morale: number;
  stamina: number;
  supplies: number;
  // daysElapsed: number; // TODO: Will be tracked when camping feature is implemented
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
    progress?: number;
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
    // daysElapsed: number; // TODO: Will be tracked when camping feature is implemented
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

// Character and Dialogue types
export const KNOWN_MOODS = [
  "neutral",
  "happy",
  "worried",
  "angry",
  "excited",
  "sad",
  "suspicious",
  "thoughtful",
  "intrigued",
  "curious",
  "friendly",
  "warm",
  "cautious",
  "playful",
  "serious",
  "contemplative",
] as const;

export type KnownMood = (typeof KNOWN_MOODS)[number];
export type CharacterMood = string; // Allow AI to generate any mood, we'll map known ones to emojis

export interface Location {
  id: string;
  name: string;
  biome: string;
  description: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  archetype: string;
  description: string;
  backgroundImage?: string;
}

export interface DialogueOption {
  id: string;
  text: string;
  tone?: string;
  outcomes?: {
    relationshipDelta?: number;
    infoGained?: string;
    unlocksSideQuest?: boolean;
  };
}

export interface DialogueResponse {
  text: string;
  mood: string; // Allow any mood string from AI
  characterAction?: string;
  character: Character;
  options: DialogueOption[];
  location?: string;
  timeOfDay?: string;
  conversationEnds?: boolean;
  isConsequential?: boolean; // Marks important decisions or story moments
}

// New dialogue-based API responses
export interface StartDialogueResponse {
  state: GameState;
  dialogue: DialogueResponse;
}

// Hybrid Interaction System types
export type GameMode =
  | "dialogue"
  | "action"
  | "exploration"
  | "encounter"
  | "reflection";

export interface ModeContext {
  dialogue: {
    characterId: string | null;
    turnNumber: number;
    canExit: boolean;
    isConsequential: boolean;
  };
  action: {
    availableCategories: string[];
    lastCategory: string | null;
  };
  exploration: {
    areaId: string | null;
    itemsFound: string[];
    turnsRemaining: number;
  };
  encounter: {
    type: "danger" | "opportunity" | "mystery" | null;
    turnsRemaining: number;
    resolved: boolean;
  };
  reflection: {
    type: "dream" | "journal" | "memory" | null;
    triggered: boolean;
  };
}

export interface HybridGameState extends GameState {
  currentMode: GameMode;
  modeContext: ModeContext;
  progress: number;
  route: Array<Location>;
  inventory: string[];
  crew: string[];
  knowledge: string[];
  lastAction: Action | null;
}

export interface GameAction extends Action {
  category: "movement" | "social" | "survival" | "special";
  mode_transition?: {
    to: GameMode;
    context?: Record<string, any>;
  };
  requirements?: Record<string, any>;
}

export interface CategorizedActions {
  movement: GameAction[];
  social: GameAction[];
  survival: GameAction[];
  special: GameAction[];
}

export interface ModeTransition {
  from: GameMode;
  to: GameMode;
  reason: string;
  message: string;
}

export interface ActionListResponse {
  actions: CategorizedActions;
  total: number;
  currentMode: GameMode;
  location: Location;
}

export interface ActionExecuteResponse {
  state: HybridGameState;
  action: GameAction;
  message: string;
  modeTransition: ModeTransition;
}

export interface ExplorationStartResponse {
  state: HybridGameState;
  exploration: {
    location: Location;
    description: string;
    turnsRemaining: number;
  };
}

export interface ExplorationResult {
  action: "search" | "observe" | "rest" | "leave";
  findings: {
    items?: string[];
    knowledge?: string[];
    supplies?: number;
    stamina?: number;
    morale?: number;
  };
  turnsRemaining: number;
}

export interface ExplorationExploreResponse {
  state: HybridGameState;
  result: ExplorationResult;
  modeTransition: ModeTransition | null;
}

export interface ConsequentialDialogue extends DialogueResponse {
  isConsequential: boolean;
  consequenceType: "reveal" | "quest" | "crisis" | "opportunity";
  canExit: boolean;
  stateChanges?: {
    description: string;
  };
}

export interface ModeTransitionResponse {
  state: HybridGameState;
  modeTransition: ModeTransition;
  dialogue?: ConsequentialDialogue;
}
