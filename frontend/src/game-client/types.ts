export type OutcomeMood = "calm" | "success" | "danger" | "mystery" | "setback";

export interface BackendChoice {
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
  id: string;
  label: string;
  detail?: string;
}

export interface BackendState {
  hash?: string;
  state_hash?: string;
  meta_hash?: string;
  day?: number;
  location?: string;
  morale?: number;
  stamina?: number;
  supplies?: number;
  outcome?: OutcomeMood;
  journal?: JournalEntry[];
  choices?: BackendChoice[];
  facts?: FactSnippet[];
  notes?: string[];
  [key: string]: unknown;
}

export interface NarrativeProse {
  title?: string;
  summary: string;
  paragraphs?: string[];
  outcome?: OutcomeMood;
  facts?: FactSnippet[];
  journal_entry?: JournalEntry;
}

export interface BackendResponse {
  state: BackendState;
  prose: NarrativeProse;
}

export interface TurnRequestPayload {
  choice_id: string;
  prev_state_hash: string;
}

export interface ViewModel {
  banner: {
    title: string;
    subtitle: string;
    mood: OutcomeMood;
  };
  narrative: string[];
  choices: Array<BackendChoice & { index: number }>;
  facts: string[];
  journal: JournalEntry[];
}
