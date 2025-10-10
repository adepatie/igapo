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

export interface WorldState {
  hash?: string;
  day?: number;
  location?: string;
  biome?: string;
  morale?: number;
  stamina?: number;
  supplies?: number;
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
