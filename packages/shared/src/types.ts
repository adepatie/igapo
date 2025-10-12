// Shared type definitions
export type OutcomeMood = "calm" | "success" | "danger" | "mystery" | "setback";

export interface Choice {
  id: string;
  label: string;
  description?: string;
  mood?: OutcomeMood;
}

export interface JournalEntry {
  id: string;
  day?: number;
  text: string;
  tags?: string[];
}

export interface FactSnippet {
  id?: string;
  label?: string;
  detail?: string;
}

export interface SupplyState {
  food: number;
  water: number;
  medicine: number;
  fuel: number;
  tools: number;
}

export interface Skill {
  type: "navigation" | "hunting" | "naturalist" | "healer";
  level: number; // 1-10
  description: string;
}

export interface PartyMember {
  characterId: string;
  name: string;
  role: string;
  skills: Skill[];
  stats: {
    morale: number;
    trustworthiness: number;
    charisma: number;
    strength: number;
    knowledge: number;
    instincts: number;
    playerLiking: number;
  };
  reputationGroups: Record<string, number>;
  recruitedAt: number;
  languages: string[];
}

export interface EconomyState {
  currencyAmount: number;
  barterGoods: Record<string, number>;
}

export interface EquipmentItem {
  itemId: string;
  itemType: "weapon" | "tool" | "artifact" | "map";
  name: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  effects: Record<string, number>;
  culturalSignificance?: string;
  acquiredAt: number;
  acquiredFrom?: string;
}

export interface TravelState {
  currentLocation: string;
  lastTravelTime: number;
  travelDistance: number;
  travelModifiers: Record<string, number>;
  retreatCount: number;
}

export interface WorldState {
  hash?: string;
  day?: number;
  location?: string;
  biome?: string;
  morale?: number;
  stamina?: number;
  supplies?: number | SupplyState;
  party?: PartyMember[];
  economy?: EconomyState;
  equipment?: EquipmentItem[];
  travel?: TravelState;
  outcome?: OutcomeMood;
  journal?: JournalEntry[];
  choices?: Choice[];
  facts?: Array<FactSnippet | string>;
  [key: string]: unknown;
}

export interface NarrativeProse {
  title?: string;
  summary: string;
  paragraphs?: string[];
  outcome?: OutcomeMood;
  facts?: Array<FactSnippet | string>;
  journal_entry?: JournalEntry;
}
