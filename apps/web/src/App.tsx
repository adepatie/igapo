import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "./components/Layout";
import OutcomeBanner from "./components/OutcomeBanner";
import ChoiceList from "./components/ChoiceList";
import Journal from "./components/Journal";
import {
  startGame,
  performAction,
  getNarration,
  getAvailableActions,
} from "./game-client/api";
import type {
  GameState,
  Narrative,
  Action,
  TurnContext,
} from "./game-client/types";

function getPlayerName(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("player") || "Explorer";
}

function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerName] = useState<string>(() => getPlayerName());

  // Initialize game
  useEffect(() => {
    async function initialize() {
      setLoading(true);
      setError(null);
      try {
        // Start the game
        const startResponse = await startGame(playerName);
        setState(startResponse.state);

        // Get intro narration
        const narrateResponse = await getNarration("intro", {
          state: startResponse.state,
        });
        setNarrative(narrateResponse.narrative);

        // Get available actions
        const actionsResponse = await getAvailableActions(startResponse.state);
        setActions(actionsResponse.actions);
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

    void initialize();
  }, [playerName]);

  const handleChoice = useCallback(
    async (actionId: string) => {
      if (!state) return;
      setLoading(true);
      setError(null);

      try {
        // Perform the action
        const actionResponse = await performAction(state, actionId);
        setState(actionResponse.state);

        // Get narration for this turn
        const narrateResponse = await getNarration("turn", {
          context: actionResponse.context,
        });
        setNarrative(narrateResponse.narrative);

        // Get new available actions
        const actionsResponse = await getAvailableActions(actionResponse.state);
        setActions(actionsResponse.actions);
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
    [state]
  );

  if (!state || !narrative) {
    return (
      <Layout>
        <p className="narrative">{error ?? "Charting the river channels..."}</p>
      </Layout>
    );
  }

  const mood = narrative.mood || "calm";
  const title = `${state.location}, Day ${state.daysElapsed}`;
  const subtitle = narrative.summary;

  // Convert journal format to match JournalEntry interface
  const journalEntries = state.journal.map((entry) => ({
    id: `day-${entry.day}`,
    day: entry.day,
    text: entry.event,
  }));

  return (
    <Layout
      sidebar={
        <>
          <div className="stats">
            <h3>Expedition Status</h3>
            <p>Morale: {state.morale}%</p>
            <p>Stamina: {state.stamina}%</p>
            <p>Supplies: {state.supplies}%</p>
          </div>
          <Journal entries={journalEntries} />
        </>
      }
      footer={
        <p>
          Player: <code>{playerName}</code> | Day: {state.daysElapsed}
        </p>
      }
    >
      <OutcomeBanner title={title} subtitle={subtitle} mood={mood} />
      {error && <p className="error">{error}</p>}
      <div className="narrative" data-testid="prose" aria-live="polite">
        {narrative.paragraphs.map((paragraph: string, index: number) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      <ChoiceList
        choices={actions.map((action, index) => ({
          ...action,
          index,
        }))}
        disabled={loading || state.status !== "active"}
        onSelect={handleChoice}
      />
      {state.status !== "active" && (
        <div className="game-over">
          <h2>
            {state.status === "success"
              ? "Expedition Complete!"
              : "Expedition Failed"}
          </h2>
          <button onClick={() => window.location.reload()}>
            Start New Journey
          </button>
        </div>
      )}
    </Layout>
  );
}

export default App;
