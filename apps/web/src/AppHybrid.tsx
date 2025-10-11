import { useCallback, useEffect, useState } from "react";
import Layout from "./components/Layout";
import LocationScene from "./components/LocationScene";
import ActionMenuBar from "./components/ActionMenuBar";
import DialogueModal from "./components/DialogueModal";
import ExpositionScene from "./components/ExpositionScene";
import ModeTransitionBanner from "./components/ModeTransitionBanner";
import type {
  HybridGameState,
  GameMode,
  DialogueResponse,
  ModeTransition,
  CategorizedActions,
} from "./game-client/types";
import {
  startDialogueGame,
  continueDialogue,
  listActions,
  executeAction,
  transitionFromDialogue,
} from "./game-client/api";

function getPlayerName(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("player") || "Explorer";
}

type ActiveModal =
  | "dialogue"
  | "encounter"
  | "reflection"
  | "exploration"
  | null;

function AppHybrid() {
  const [state, setState] = useState<HybridGameState | null>(null);
  const [currentMode, setCurrentMode] = useState<GameMode>("dialogue");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [dialogue, setDialogue] = useState<DialogueResponse | null>(null);
  const [actions, setActions] = useState<CategorizedActions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerName] = useState<string>(() => getPlayerName());
  const [metCharacterIds, setMetCharacterIds] = useState<string[]>([]);
  const [showExposition, setShowExposition] = useState(true);
  const [pendingTransition, setPendingTransition] =
    useState<ModeTransition | null>(null);

  // Initialize game
  const handleStartJourney = useCallback(async () => {
    console.log("[AppHybrid] Starting journey for player:", playerName);
    setShowExposition(false);
    setLoading(true);
    setError(null);

    try {
      const response = await startDialogueGame(playerName);
      console.log("[AppHybrid] Got initial response:", response);

      // Cast to HybridGameState (backend will have the mode fields)
      const hybridState = response.state as unknown as HybridGameState;
      setState(hybridState);
      setDialogue(response.dialogue);
      setCurrentMode(hybridState.currentMode || "dialogue");
      setActiveModal("dialogue");
      setMetCharacterIds([response.dialogue.character.id]);
    } catch (err) {
      console.error("[AppHybrid] Error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start the game."
      );
    } finally {
      setLoading(false);
    }
  }, [playerName]);

  // Handle dialogue option selection
  const handleDialogueOption = useCallback(
    async (optionId: string) => {
      if (!state || !dialogue) return;

      console.log("[AppHybrid] Selected dialogue option:", optionId);
      setLoading(true);
      setError(null);

      try {
        const selectedOption = dialogue.options.find(
          (opt) => opt.id === optionId
        );

        if (!selectedOption) {
          throw new Error("Selected option not found");
        }

        // Check if this is a farewell/end option
        const isFarewell =
          optionId === "farewell" ||
          optionId === "end" ||
          selectedOption.text.toLowerCase().includes("farewell") ||
          selectedOption.text.toLowerCase().includes("get going");

        if (isFarewell) {
          console.log(
            "[AppHybrid] Ending conversation, closing dialogue modal"
          );

          // Close the dialogue modal
          setActiveModal(null);

          // Transition from dialogue to next mode (likely action)
          const transitionResponse = await transitionFromDialogue(
            state,
            { conversationEnds: true },
            metCharacterIds
          );

          setState(transitionResponse.state);

          // Only show transition banner for special modes, not for dialogue->action
          if (
            transitionResponse.modeTransition &&
            ["exploration", "encounter", "reflection"].includes(
              transitionResponse.modeTransition.to
            )
          ) {
            setPendingTransition(transitionResponse.modeTransition);
          } else {
            setCurrentMode(transitionResponse.modeTransition?.to || "action");
          }

          // If we got new dialogue (e.g., random encounter), show it in modal
          if (transitionResponse.dialogue) {
            setDialogue(transitionResponse.dialogue);
            setActiveModal("dialogue");
            setMetCharacterIds([
              ...metCharacterIds,
              transitionResponse.dialogue.character.id,
            ]);
          }
        } else {
          // Continue with current character
          const response = await continueDialogue({
            state,
            characterId: dialogue.character.id,
            selectedOptionId: optionId,
            selectedOptionText: selectedOption.text,
            selectedOptionTone: selectedOption.tone || "neutral",
            previousDialogue: dialogue.text,
          });

          setDialogue(response.dialogue);

          // Check if conversation ended naturally
          if (response.dialogue.conversationEnds) {
            console.log(
              "[AppHybrid] Conversation ended, closing modal and transitioning..."
            );

            // Small delay before transitioning
            setTimeout(async () => {
              try {
                // Close the dialogue modal
                setActiveModal(null);

                const transitionResponse = await transitionFromDialogue(
                  state,
                  { conversationEnds: true },
                  metCharacterIds
                );

                setState(transitionResponse.state);

                // Only show transition banner for special modes
                if (
                  transitionResponse.modeTransition &&
                  ["exploration", "encounter", "reflection"].includes(
                    transitionResponse.modeTransition.to
                  )
                ) {
                  setPendingTransition(transitionResponse.modeTransition);
                } else {
                  setCurrentMode(
                    transitionResponse.modeTransition?.to || "action"
                  );
                }

                if (transitionResponse.dialogue) {
                  setDialogue(transitionResponse.dialogue);
                  setActiveModal("dialogue");
                  setMetCharacterIds([
                    ...metCharacterIds,
                    transitionResponse.dialogue.character.id,
                  ]);
                }
              } catch (err) {
                console.error("[AppHybrid] Error transitioning:", err);
                setError(
                  err instanceof Error ? err.message : "Transition failed"
                );
              }
            }, 1500);
          }
        }
      } catch (err) {
        console.error("[AppHybrid] Error handling dialogue:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to continue the conversation."
        );
      } finally {
        setLoading(false);
      }
    },
    [state, dialogue, metCharacterIds]
  );

  // Handle action selection
  const handleActionSelection = useCallback(
    async (actionId: string) => {
      if (!state) return;

      console.log("[AppHybrid] Executing action:", actionId);
      setLoading(true);
      setError(null);

      try {
        const response = await executeAction(state, actionId);

        setState(response.state);

        // Handle mode transitions
        if (response.modeTransition) {
          const targetMode = response.modeTransition.to;

          // Show transition banner only for special modes
          if (["exploration", "encounter", "reflection"].includes(targetMode)) {
            setPendingTransition(response.modeTransition);
          } else {
            // Simple mode change (e.g., action -> action after movement, or action -> dialogue)
            setCurrentMode(targetMode);

            // If transitioning to dialogue, the backend should provide dialogue in a subsequent call
            // For now, just update the mode
          }
        }

        // Reload actions after execution
        const actionsResponse = await listActions(response.state);
        setActions(actionsResponse.actions);

        console.log("[AppHybrid] Action result:", response.message);
      } catch (err) {
        console.error("[AppHybrid] Error executing action:", err);
        setError(err instanceof Error ? err.message : "Action failed");
      } finally {
        setLoading(false);
      }
    },
    [state, metCharacterIds]
  );

  // Load actions when state changes or entering action mode
  useEffect(() => {
    if (state && !loading && !activeModal) {
      console.log("[AppHybrid] Loading actions");

      listActions(state)
        .then((response) => {
          setActions(response.actions);
          console.log("[AppHybrid] Loaded actions:", response.total);
        })
        .catch((err) => {
          console.error("[AppHybrid] Error loading actions:", err);
          setError("Failed to load actions");
        });
    }
  }, [state, loading, activeModal]);

  // Handle acknowledging mode transition
  const handleAcknowledgeTransition = useCallback(() => {
    if (!pendingTransition) return;

    console.log(
      "[AppHybrid] Acknowledging transition to:",
      pendingTransition.to
    );
    setCurrentMode(pendingTransition.to);
    setPendingTransition(null);
  }, [pendingTransition]);

  // Show exposition before game starts
  if (showExposition) {
    return (
      <Layout>
        <ExpositionScene
          onContinue={handleStartJourney}
          playerName={playerName}
        />
      </Layout>
    );
  }

  // Loading state (after exposition is dismissed)
  if (!state) {
    return (
      <Layout>
        <div className="dialogue-scene">
          {error ? (
            <div className="error" data-testid="error-message">
              {error}
            </div>
          ) : (
            <div data-testid="loading-message">
              Preparing your expedition...
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Mode transition banner (overlay)
  if (pendingTransition) {
    return (
      <Layout>
        <ModeTransitionBanner
          transition={pendingTransition}
          onAcknowledge={handleAcknowledgeTransition}
        />
      </Layout>
    );
  }

  // Render with new layered architecture: LocationScene + ActionMenuBar + Modals
  const currentLocation = state.route[state.progress];
  const timeOfDay = dialogue?.timeOfDay || "daytime";

  return (
    <Layout
      sidebar={
        <>
          <div>
            <h3>Stats</h3>
            <p>⚡ Morale: {state.morale}%</p>
            <p>💪 Stamina: {state.stamina}%</p>
            <p>📦 Supplies: {state.supplies}</p>
          </div>
          <div>
            <h3>Journey</h3>
            <p>📍 {currentLocation.name}</p>
            <p>🌿 {currentLocation.biome}</p>
            <p>
              🛤️ Progress: {state.progress + 1}/{state.route.length}
            </p>
          </div>
          <div>
            <h3>Mode</h3>
            <p>
              {currentMode === "dialogue" && "💬 Conversation"}
              {currentMode === "action" && "⚡ Action"}
              {currentMode === "exploration" && "🔍 Exploration"}
              {currentMode === "encounter" && "⚠️ Encounter"}
              {currentMode === "reflection" && "💭 Reflection"}
            </p>
          </div>
          {state.inventory.length > 0 && (
            <div>
              <h3>Inventory</h3>
              {state.inventory.slice(0, 5).map((item, i) => (
                <p key={i}>• {item}</p>
              ))}
            </div>
          )}
        </>
      }
      footer={
        <p>
          Player: <code>{playerName}</code> • Mode: {currentMode}
        </p>
      }
    >
      {error && (
        <div className="error" data-testid="error-message">
          {error}
        </div>
      )}

      {/* LocationScene - Always visible base layer */}
      <LocationScene
        location={{
          id: currentLocation.id,
          name: currentLocation.name,
          biome: currentLocation.biome,
          description: currentLocation.description,
        }}
        timeOfDay={timeOfDay}
        hasActiveModal={activeModal !== null}
      >
        {/* ActionMenuBar - Persistent at bottom, disabled when modal is active */}
        {actions && (
          <ActionMenuBar
            actions={actions}
            onSelectAction={handleActionSelection}
            isProcessing={loading}
            disabled={activeModal !== null}
          />
        )}
      </LocationScene>

      {/* DialogueModal - Overlay when in dialogue */}
      {activeModal === "dialogue" && dialogue && (
        <DialogueModal
          character={dialogue.character}
          mood={dialogue.mood}
          characterAction={dialogue.characterAction}
          dialogueText={dialogue.text}
          options={dialogue.options}
          onSelectOption={handleDialogueOption}
          isProcessing={loading}
          isConsequential={dialogue.conversationEnds}
        />
      )}

      {/* Exploration Modal - Coming soon */}
      {activeModal === "exploration" && (
        <div className="exploration-modal">
          <h2>🔍 Exploration Mode</h2>
          <p>Exploration modal UI coming soon...</p>
        </div>
      )}

      {/* Encounter Modal - Coming soon */}
      {activeModal === "encounter" && (
        <div className="encounter-modal">
          <h2>⚠️ Encounter!</h2>
          <p>Encounter modal UI coming soon...</p>
        </div>
      )}

      {/* Reflection Modal - Coming soon */}
      {activeModal === "reflection" && (
        <div className="reflection-modal">
          <h2>💭 Reflection</h2>
          <p>Reflection modal UI coming soon...</p>
        </div>
      )}
    </Layout>
  );
}

export default AppHybrid;
