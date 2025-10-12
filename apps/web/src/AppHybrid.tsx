import { useCallback, useEffect, useState } from "react";
// import { useGameStore } from "./store/gameStore"; // TODO: Implement Zustand store
import Layout from "./components/Layout";
import LocationScene from "./components/LocationScene";
import ActionMenuBar from "./components/ActionMenuBar";
import DialogueModal from "./components/DialogueModal";
import ExplorationModal from "./components/ExplorationModal";
import EncounterModal from "./components/EncounterModal";
import ReflectionModal from "./components/ReflectionModal";
import ExpositionScene from "./components/ExpositionScene";
import ModeTransitionBanner from "./components/ModeTransitionBanner";
import SupplyDisplay from "./components/ui/SupplyDisplay";
import SurvivalStatus from "./components/ui/SurvivalStatus";
import Pocketwatch from "./components/ui/Pocketwatch";
import WeatherIndicator from "./components/ui/WeatherIndicator";
import PartyPanel from "./components/ui/PartyPanel";
import Minimap from "./components/ui/Minimap";
import "./components/ui/ui-components.css";
import type {
  HybridGameState,
  GameMode,
  DialogueResponse,
  ModeTransition,
  CategorizedActions,
  ExplorationStartResponse,
} from "./game-client/types";
import {
  startDialogueGame,
  continueDialogue,
  getNewCharacter,
  listActions,
  executeAction,
  transitionFromDialogue,
  startExploration,
  exploreArea,
} from "./game-client/api";

function getPlayerName(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("player") || "Explorer";
}

// Helper function to get current time and day
function getCurrentTimeAndDay(): {
  currentTime: string;
  currentDay: number;
  timeOfDay: string;
} {
  const now = new Date();
  const currentTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const currentDay = Math.floor(now.getTime() / (24 * 60 * 60 * 1000)) + 1;

  const hour = now.getHours();
  let timeOfDay: string;
  if (hour >= 5 && hour < 8) timeOfDay = "dawn";
  else if (hour >= 8 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
  else if (hour >= 17 && hour < 19) timeOfDay = "dusk";
  else if (hour >= 19 && hour < 22) timeOfDay = "evening";
  else timeOfDay = "night";

  return { currentTime, currentDay, timeOfDay };
}

// Helper function to format survival data
function formatSurvivalData(state: HybridGameState) {
  if (!state.survival) {
    return {
      dehydration: { stage: 0, timeRemaining: 72 * 3600 },
      starvation: { stage: 0, timeRemaining: 21 * 24 * 3600 },
    };
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeSinceWater = currentTime - state.survival.lastWaterConsumption;
  const timeSinceFood = currentTime - state.survival.lastFoodConsumption;

  return {
    dehydration: {
      stage: state.survival.dehydrationStage,
      timeRemaining: Math.max(0, 72 * 3600 - timeSinceWater),
    },
    starvation: {
      stage: state.survival.starvationStage,
      timeRemaining: Math.max(0, 21 * 24 * 3600 - timeSinceFood),
    },
  };
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
  const [explorationData, setExplorationData] = useState<any>(null);
  const [encounterData, setEncounterData] = useState<any>(null);
  const [reflectionData, setReflectionData] = useState<any>(null);

  // Sync activeModal with currentMode for special modes
  useEffect(() => {
    if (
      currentMode === "exploration" ||
      currentMode === "encounter" ||
      currentMode === "reflection"
    ) {
      setActiveModal(currentMode);
    } else if (currentMode === "action") {
      setActiveModal(null); // Clear modal when in action mode
      setDialogue(null); // Clear dialogue when exiting dialogue mode
      setExplorationData(null); // Clear exploration data
      setEncounterData(null); // Clear encounter data
      setReflectionData(null); // Clear reflection data
    }
    // Note: dialogue mode sets activeModal explicitly when dialogue is loaded
  }, [currentMode]);

  // Start exploration when entering exploration mode
  useEffect(() => {
    if (currentMode === "exploration" && state && !explorationData) {
      console.log("[AppHybrid] Starting exploration mode");
      setLoading(true);

      startExploration(state)
        .then((response: ExplorationStartResponse) => {
          console.log("[AppHybrid] Exploration started:", response);
          setState(response.state);
          setExplorationData(response.exploration);
        })
        .catch((err) => {
          console.error("[AppHybrid] Error starting exploration:", err);
          setError("Failed to start exploration");
        })
        .finally(() => setLoading(false));
    }
  }, [currentMode, state, explorationData]);

  // Fetch dialogue when entering dialogue mode from action (e.g., NPC encounter)
  useEffect(() => {
    if (currentMode === "dialogue" && state && !dialogue && !loading) {
      console.log(
        "[AppHybrid] Entering dialogue mode, fetching dialogue content..."
      );
      setLoading(true);

      // Try to get a new character dialogue (e.g., from encounter context)
      getNewCharacter({ state, excludeIds: metCharacterIds })
        .then((response) => {
          console.log("[AppHybrid] Got dialogue from encounter:", response);
          setDialogue(response.dialogue);
          setActiveModal("dialogue");
          setMetCharacterIds([
            ...metCharacterIds,
            response.dialogue.character.id,
          ]);
        })
        .catch((err) => {
          console.error("[AppHybrid] Error fetching dialogue:", err);
          setError("Failed to start dialogue");
          // Fall back to action mode if dialogue fetch fails
          setCurrentMode("action");
        })
        .finally(() => setLoading(false));
    }
  }, [currentMode, state, dialogue, loading, metCharacterIds]);

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

          // Show transition banner only for special modes (not dialogue)
          if (["exploration", "encounter", "reflection"].includes(targetMode)) {
            setPendingTransition(response.modeTransition);
          } else if (targetMode === "dialogue") {
            // Action triggered a dialogue transition (e.g., NPC encounter after movement)
            console.log(
              "[AppHybrid] Action triggered dialogue, fetching dialogue content..."
            );

            // Show arrival banner for dialogue transitions too
            setPendingTransition(response.modeTransition);

            // Fetch dialogue content after banner acknowledgment
            // (will be handled by a useEffect watching currentMode === 'dialogue')
          } else {
            // Simple mode change (e.g., action -> action)
            setCurrentMode(targetMode);
          }
        }

        // Reload actions after execution if staying in action mode
        if (
          !response.modeTransition ||
          response.modeTransition.to === "action"
        ) {
          const actionsResponse = await listActions(response.state);
          setActions(actionsResponse.actions);
        }

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

  // Handle exploration actions
  const handleExplorationAction = useCallback(
    async (action: "search" | "observe" | "rest" | "leave") => {
      if (!state) return;

      console.log("[AppHybrid] Exploration action:", action);
      setLoading(true);
      setError(null);

      try {
        const response = await exploreArea(state, action);

        setState(response.state);

        // Generate description based on findings
        let newDescription =
          explorationData?.description || "You continue exploring the area.";
        if (
          response.result.findings.items &&
          response.result.findings.items.length > 0
        ) {
          newDescription = `You found: ${response.result.findings.items.join(
            ", "
          )}!`;
        } else if (
          response.result.findings.knowledge &&
          response.result.findings.knowledge.length > 0
        ) {
          newDescription = `You learned: ${response.result.findings.knowledge.join(
            ", "
          )}.`;
        } else if (action === "rest") {
          newDescription = "You take a moment to rest and regain your stamina.";
        } else {
          newDescription = "You search the area but find nothing of interest.";
        }

        setExplorationData({
          ...explorationData,
          description: newDescription,
          turnsRemaining:
            response.state.modeContext?.exploration?.turnsRemaining || 0,
          itemsFound: response.state.modeContext?.exploration?.itemsFound || [],
        });

        // Handle mode transition if exploration ended
        if (response.modeTransition) {
          console.log(
            "[AppHybrid] Exploration ended, transitioning to:",
            response.modeTransition.to
          );
          setExplorationData(null);
          setCurrentMode(response.modeTransition.to);

          // Reload actions if transitioning back to action mode
          if (response.modeTransition.to === "action") {
            const actionsResponse = await listActions(response.state);
            setActions(actionsResponse.actions);
          }
        }
      } catch (err) {
        console.error("[AppHybrid] Error during exploration:", err);
        setError(err instanceof Error ? err.message : "Exploration failed");
      } finally {
        setLoading(false);
      }
    },
    [state, explorationData]
  );

  // Handle acknowledging mode transition
  const handleAcknowledgeTransition = useCallback(() => {
    if (!pendingTransition) return;

    console.log(
      "[AppHybrid] Acknowledging transition to:",
      pendingTransition.to
    );

    // Store transition context for the target mode
    if (pendingTransition.to === "encounter" && pendingTransition.context) {
      setEncounterData({
        type: pendingTransition.context.hazardType || "mystery",
        description: pendingTransition.message,
        turnsRemaining: 3,
        resolved: false,
      });
    } else if (
      pendingTransition.to === "reflection" &&
      pendingTransition.context
    ) {
      setReflectionData({
        type: "memory",
        content: pendingTransition.message,
        title: pendingTransition.context.title || "A Moment of Reflection",
      });
    }

    setCurrentMode(pendingTransition.to);
    setPendingTransition(null);
  }, [pendingTransition]);

  // Handle encounter option selection
  const handleEncounterOption = useCallback(
    async (optionId: string) => {
      if (!state) return;

      console.log("[AppHybrid] Encounter option:", optionId);
      setLoading(true);
      setError(null);

      try {
        // For now, just close the encounter and refresh actions
        // In the future, this could call a dedicated encounter resolution endpoint
        setEncounterData(null);
        setCurrentMode("action");

        const actionsResponse = await listActions(state);
        setActions(actionsResponse.actions);
      } catch (err) {
        console.error("[AppHybrid] Error handling encounter:", err);
        setError(err instanceof Error ? err.message : "Encounter failed");
      } finally {
        setLoading(false);
      }
    },
    [state]
  );

  // Handle reflection continuation
  const handleReflectionContinue = useCallback(async () => {
    if (!state) return;

    console.log("[AppHybrid] Continuing from reflection");
    setLoading(true);
    setError(null);

    try {
      setReflectionData(null);
      setCurrentMode("action");

      const actionsResponse = await listActions(state);
      setActions(actionsResponse.actions);
    } catch (err) {
      console.error("[AppHybrid] Error continuing from reflection:", err);
      setError(err instanceof Error ? err.message : "Failed to continue");
    } finally {
      setLoading(false);
    }
  }, [state]);

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
  const {
    currentTime,
    currentDay,
    timeOfDay: gameTimeOfDay,
  } = getCurrentTimeAndDay();
  const survivalData = formatSurvivalData(state);

  // Check if supplies is the new structure or old number
  const suppliesData =
    typeof state.supplies === "object"
      ? state.supplies
      : {
          food: Math.floor(state.supplies / 5),
          water: Math.floor(state.supplies / 4),
          medicine: Math.floor(state.supplies / 40),
          fuel: Math.floor(state.supplies / 12),
          tools: Math.floor(state.supplies / 24),
        };

  return (
    <Layout
      pocketwatch={
        <Pocketwatch
          currentTime={currentTime}
          currentDay={currentDay}
          timeOfDay={gameTimeOfDay}
        />
      }
      supplyDisplay={<SupplyDisplay supplies={suppliesData} />}
      survivalStatus={<SurvivalStatus survival={survivalData} />}
      weatherIndicator={<WeatherIndicator weather={state.weather} />}
      partyPanel={<PartyPanel party={state.party || []} />}
      minimap={
        <Minimap
          minimap={{
            discoveredLocations: state.minimap?.discoveredLocations || [],
            currentLocation: state.minimap?.currentLocation || state.location,
            route: state.route,
          }}
        />
      }
      sidebar={
        <>
          <div>
            <h3>Stats</h3>
            <p>⚡ Morale: {state.morale}%</p>
            <p>💪 Stamina: {state.stamina}%</p>
            <p>
              📦 Supplies:{" "}
              {typeof state.supplies === "object"
                ? "See status bar"
                : state.supplies}
            </p>
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

      {/* Exploration Modal */}
      {activeModal === "exploration" && explorationData && (
        <ExplorationModal
          location={explorationData.location}
          description={explorationData.description}
          turnsRemaining={explorationData.turnsRemaining}
          itemsFound={explorationData.itemsFound}
          onAction={handleExplorationAction}
          isProcessing={loading}
        />
      )}

      {/* Encounter Modal */}
      {activeModal === "encounter" && encounterData && (
        <EncounterModal
          type={encounterData.type}
          description={encounterData.description}
          turnsRemaining={encounterData.turnsRemaining}
          resolved={encounterData.resolved}
          options={[
            { id: "fight", text: "Face the danger", risk: "high" },
            { id: "evade", text: "Try to avoid it", risk: "medium" },
            { id: "flee", text: "Retreat to safety", risk: "low" },
          ]}
          onSelectOption={handleEncounterOption}
          isProcessing={loading}
        />
      )}

      {/* Reflection Modal */}
      {activeModal === "reflection" && reflectionData && (
        <ReflectionModal
          type={reflectionData.type}
          content={reflectionData.content}
          title={reflectionData.title}
          onContinue={handleReflectionContinue}
          isProcessing={loading}
        />
      )}
    </Layout>
  );
}

export default AppHybrid;
