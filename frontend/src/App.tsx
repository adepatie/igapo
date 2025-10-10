import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "./components/Layout";
import OutcomeBanner from "./components/OutcomeBanner";
import ChoiceList from "./components/ChoiceList";
import FactChips from "./components/FactChips";
import Journal from "./components/Journal";
import { fetchStart, postTurn } from "./game-client/api";
import type {
  BackendResponse,
  BackendState,
  NarrativeProse,
} from "./game-client/types";
import { selectViewModel } from "./selectors/selectViewModel";

function parseSeed(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  const seed = params.get("seed");
  return seed ?? undefined;
}

const FALLBACK_PROSE: NarrativeProse = {
  summary: "The river awaits your command.",
  paragraphs: [
    "The crew watches the current, waiting for your next instruction.",
  ],
  outcome: "calm",
};

function mergeResponse(response: BackendResponse): {
  state: BackendState;
  prose: NarrativeProse;
} {
  return {
    state: response.state,
    prose: {
      ...FALLBACK_PROSE,
      ...response.prose,
      summary: response.prose?.summary ?? FALLBACK_PROSE.summary,
      paragraphs:
        response.prose?.paragraphs && response.prose.paragraphs.length
          ? response.prose.paragraphs
          : FALLBACK_PROSE.paragraphs,
    },
  };
}

function App() {
  const [state, setState] = useState<BackendState | null>(null);
  const [prose, setProse] = useState<NarrativeProse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seed] = useState<string | undefined>(() => parseSeed());

  const viewModel = useMemo(() => {
    if (!state || !prose) return null;
    return selectViewModel(state, prose);
  }, [state, prose]);

  useEffect(() => {
    async function initialise() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchStart(seed);
        const merged = mergeResponse(response);
        setState(merged.state);
        setProse(merged.prose);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to contact the expedition server."
        );
      } finally {
        setLoading(false);
      }
    }

    void initialise();
  }, [seed]);

  const handleChoice = useCallback(
    async (choiceId: string) => {
      if (!state || !viewModel) return;
      setLoading(true);
      setError(null);

      try {
        const response = await postTurn({
          choice_id: choiceId,
          prev_state_hash: viewModel.stateHash,
        });
        const merged = mergeResponse(response);
        setState(merged.state);
        setProse(merged.prose);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "We lost contact with the expedition server."
        );
      } finally {
        setLoading(false);
      }
    },
    [state, viewModel]
  );

  if (!viewModel) {
    return (
      <Layout>
        <p className="narrative">{error ?? "Charting the river channels..."}</p>
      </Layout>
    );
  }

  return (
    <Layout
      sidebar={
        <>
          <FactChips facts={viewModel.facts} />
          <Journal entries={viewModel.journal} />
        </>
      }
      footer={
        <p>
          Seed: <code>{seed ?? "(none)"}</code>
        </p>
      }
    >
      <OutcomeBanner
        title={viewModel.banner.title}
        subtitle={viewModel.banner.subtitle}
        mood={viewModel.banner.mood}
      />
      {error && <p className="error">{error}</p>}
      <div className="narrative">
        {viewModel.narrative.map((paragraph: string) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <ChoiceList
        choices={viewModel.choices}
        disabled={loading}
        onSelect={handleChoice}
      />
    </Layout>
  );
}

export default App;
