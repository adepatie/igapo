import type {
  BackendChoice,
  BackendState,
  NarrativeProse,
  OutcomeMood,
  ViewModel,
} from "../game-client/types";

const DEFAULT_BANNER_TITLE = "Amazon River Expedition";
const DEFAULT_MOOD: OutcomeMood = "calm";

function normaliseFacts(
  facts?: NarrativeProse["facts"] | BackendState["facts"]
): string[] {
  if (!facts) return [];
  return facts.map((fact) => {
    if (typeof fact === "string") return fact;
    if (!fact) return "";
    const detail = "detail" in fact && fact.detail ? ` — ${fact.detail}` : "";
    const label = "label" in fact && fact.label ? fact.label : String(fact);
    return `${label}${detail}`.trim();
  });
}

function deriveHash(state: BackendState): string {
  return (
    state.hash ||
    state.state_hash ||
    state.meta_hash ||
    (typeof state.id === "string" ? state.id : undefined) ||
    cryptoDigest(JSON.stringify(state))
  );
}

function cryptoDigest(payload: string): string {
  let hash = 0;
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}`;
}

function decorateChoices(
  choices: BackendChoice[] = []
): Array<BackendChoice & { index: number }> {
  return choices.map((choice, index) => ({
    ...choice,
    index,
  }));
}

export function selectViewModel(
  state: BackendState,
  prose: NarrativeProse
): ViewModel & {
  stateHash: string;
} {
  const bannerTitle = prose.title ?? state.location ?? DEFAULT_BANNER_TITLE;
  const summary = prose.summary?.trim() || "Continue the journey.";
  const paragraphs = prose.paragraphs?.length ? prose.paragraphs : [summary];
  const mood = prose.outcome || state.outcome || DEFAULT_MOOD;

  const combinedFacts = [
    ...normaliseFacts(state.facts),
    ...normaliseFacts(prose.facts),
  ].filter(Boolean);

  const journalEntries = [...(state.journal ?? [])];
  if (prose.journal_entry) {
    journalEntries.push(prose.journal_entry);
  }

  return {
    stateHash: deriveHash(state),
    banner: {
      title: bannerTitle,
      subtitle: summary,
      mood,
    },
    narrative: paragraphs,
    choices: decorateChoices(state.choices ?? []),
    facts: Array.from(new Set(combinedFacts)),
    journal: journalEntries,
  };
}
