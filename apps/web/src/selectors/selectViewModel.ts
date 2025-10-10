import type {
  Choice as BackendChoice,
  WorldState as BackendState,
  NarrativeProse,
  OutcomeMood,
} from "@igapo/shared";

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
    (state as any).hash ||
    (state as any).state_hash ||
    (state as any).meta_hash ||
    (typeof (state as any).id === "string" ? (state as any).id : undefined) ||
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
): {
  stateHash: string;
  banner: {
    title: string;
    subtitle: string;
    mood: OutcomeMood;
  };
  narrative: string[];
  choices: Array<BackendChoice & { index: number }>;
  facts: string[];
  journal: BackendState["journal"];
} {
  const bannerTitle =
    prose.title ?? (state as any).location ?? DEFAULT_BANNER_TITLE;
  const summary = prose.summary?.trim() || "Continue the journey.";
  const paragraphs = prose.paragraphs?.length ? prose.paragraphs : [summary];
  const mood = prose.outcome || (state as any).outcome || DEFAULT_MOOD;

  const combinedFacts = [
    ...normaliseFacts((state as any).facts),
    ...normaliseFacts(prose.facts),
  ].filter(Boolean);

  const journalEntries = [...((state as any).journal ?? [])];
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
    choices: decorateChoices((state as any).choices ?? []),
    facts: Array.from(new Set(combinedFacts)),
    journal: journalEntries,
  };
}
