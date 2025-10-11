/**
 * Mode Manager - Handles transitions between game modes
 * Part of the Hybrid Interaction System
 */

/**
 * Transition from dialogue to action mode
 */
export const transitionFromDialogue = (state, dialogueResult) => {
  const nextState = { ...state };

  // Apply any state changes from dialogue
  if (dialogueResult.stateChanges) {
    Object.assign(nextState, dialogueResult.stateChanges);
  }

  // Check if this was a consequential dialogue
  const wasConsequential = nextState.modeContext.dialogue.isConsequential;

  if (wasConsequential) {
    // Consequential dialogues might trigger encounters or force progression
    if (dialogueResult.triggersEncounter) {
      nextState.currentMode = "encounter";
      nextState.modeContext.encounter = {
        type: dialogueResult.encounterType || "mystery",
        turnsRemaining: dialogueResult.encounterDuration || 3,
        resolved: false,
      };
      return {
        state: nextState,
        mode: "encounter",
        reason: "triggered_by_dialogue",
      };
    }

    if (dialogueResult.forcesReflection) {
      nextState.currentMode = "reflection";
      nextState.modeContext.reflection = {
        type: "memory",
        triggered: true,
      };
      return {
        state: nextState,
        mode: "reflection",
        reason: "triggered_by_dialogue",
      };
    }
  }

  // Default: go to action mode
  nextState.currentMode = "action";
  nextState.modeContext.action.lastCategory = null;

  return { state: nextState, mode: "action", reason: "dialogue_ended" };
};

/**
 * Transition from action mode to another mode
 */
export const transitionFromAction = (state, actionResult) => {
  const nextState = { ...state };

  // If action specified a mode transition, use it
  if (actionResult.modeTransition) {
    return {
      state: nextState,
      mode: actionResult.modeTransition.to,
      reason: "action_triggered",
    };
  }

  // Check for random encounters (10% chance after movement actions)
  if (actionResult.action.category === "movement" && Math.random() < 0.1) {
    const encounterTypes = ["danger", "opportunity", "mystery"];
    const randomType =
      encounterTypes[Math.floor(Math.random() * encounterTypes.length)];

    nextState.currentMode = "encounter";
    nextState.modeContext.encounter = {
      type: randomType,
      turnsRemaining: 2,
      resolved: false,
    };

    return { state: nextState, mode: "encounter", reason: "random_encounter" };
  }

  // Check if we should trigger reflection (after certain milestones)
  if (state.progress > 0 && state.progress % 3 === 0) {
    const lastJournalEntry = state.journal[state.journal.length - 1];
    if (lastJournalEntry && !lastJournalEntry.reflected) {
      nextState.currentMode = "reflection";
      nextState.modeContext.reflection = {
        type: "dream",
        triggered: true,
      };
      return {
        state: nextState,
        mode: "reflection",
        reason: "milestone_reached",
      };
    }
  }

  // Default: stay in action mode
  nextState.currentMode = "action";
  return { state: nextState, mode: "action", reason: "continue" };
};

/**
 * Transition from exploration mode
 */
export const transitionFromExploration = (state, explorationResult) => {
  const nextState = { ...state };

  // Apply findings
  if (explorationResult.itemsFound && explorationResult.itemsFound.length > 0) {
    nextState.inventory = [
      ...nextState.inventory,
      ...explorationResult.itemsFound,
    ];
  }

  if (explorationResult.knowledgeGained) {
    nextState.knowledge = [
      ...nextState.knowledge,
      ...explorationResult.knowledgeGained,
    ];
  }

  // Check if exploration triggered an encounter
  if (explorationResult.triggersEncounter) {
    nextState.currentMode = "encounter";
    nextState.modeContext.encounter = {
      type: explorationResult.encounterType || "mystery",
      turnsRemaining: 2,
      resolved: false,
    };
    return {
      state: nextState,
      mode: "encounter",
      reason: "discovered_during_exploration",
    };
  }

  // Check if exploration led to a character
  if (explorationResult.foundCharacter) {
    nextState.currentMode = "dialogue";
    nextState.modeContext.dialogue = {
      characterId: explorationResult.characterId,
      turnNumber: 0,
      canExit: true,
      isConsequential: false,
    };
    return {
      state: nextState,
      mode: "dialogue",
      reason: "met_during_exploration",
    };
  }

  // Default: return to action mode
  nextState.currentMode = "action";
  return { state: nextState, mode: "action", reason: "exploration_complete" };
};

/**
 * Transition from encounter mode
 */
export const transitionFromEncounter = (state, encounterResult) => {
  const nextState = { ...state };

  // Mark encounter as resolved
  nextState.modeContext.encounter.resolved = true;

  // Apply consequences
  if (encounterResult.stateChanges) {
    Object.assign(nextState, encounterResult.stateChanges);
  }

  // Check if encounter leads to dialogue
  if (encounterResult.leadsToDialogue) {
    nextState.currentMode = "dialogue";
    nextState.modeContext.dialogue = {
      characterId: encounterResult.characterId,
      turnNumber: 0,
      canExit: encounterResult.canExit || false,
      isConsequential: true,
    };
    return { state: nextState, mode: "dialogue", reason: "encounter_resolved" };
  }

  // Check if we need reflection after a traumatic encounter
  if (encounterResult.wasTraumatic) {
    nextState.currentMode = "reflection";
    nextState.modeContext.reflection = {
      type: "memory",
      triggered: true,
    };
    return {
      state: nextState,
      mode: "reflection",
      reason: "traumatic_encounter",
    };
  }

  // Default: return to action mode
  nextState.currentMode = "action";
  return { state: nextState, mode: "action", reason: "encounter_resolved" };
};

/**
 * Transition from reflection mode
 */
export const transitionFromReflection = (state, reflectionResult) => {
  const nextState = { ...state };

  // Mark last journal entry as reflected upon
  if (nextState.journal.length > 0) {
    const lastEntry = nextState.journal[nextState.journal.length - 1];
    lastEntry.reflected = true;
  }

  // Reflection typically restores morale
  const morale = Math.min(100, nextState.morale + 5);
  nextState.morale = morale;

  // Apply any insights gained
  if (reflectionResult.insightsGained) {
    nextState.knowledge = [
      ...nextState.knowledge,
      ...reflectionResult.insightsGained,
    ];
  }

  // Return to action mode (player decides what to do next)
  nextState.currentMode = "action";
  return { state: nextState, mode: "action", reason: "reflection_complete" };
};

/**
 * Main transition handler - routes to appropriate function
 */
export const handleModeTransition = (state, fromMode, result) => {
  switch (fromMode) {
    case "dialogue":
      return transitionFromDialogue(state, result);
    case "action":
      return transitionFromAction(state, result);
    case "exploration":
      return transitionFromExploration(state, result);
    case "encounter":
      return transitionFromEncounter(state, result);
    case "reflection":
      return transitionFromReflection(state, result);
    default:
      // Default to action mode
      return {
        state: { ...state, currentMode: "action" },
        mode: "action",
        reason: "unknown_mode",
      };
  }
};

/**
 * Get appropriate next mode context message for UI
 */
export const getModeTransitionMessage = (fromMode, toMode, reason) => {
  const messages = {
    dialogue_ended: "What would you like to do next?",
    action_triggered: "Your action leads to something new...",
    random_encounter: "Something catches your attention!",
    milestone_reached: "You take a moment to reflect on your journey...",
    discovered_during_exploration:
      "Your exploration reveals something unexpected!",
    met_during_exploration: "You encounter someone...",
    exploration_complete: "You finish exploring the area.",
    encounter_resolved: "The encounter ends.",
    traumatic_encounter: "You need time to process what just happened...",
    reflection_complete: "You feel more centered now.",
    triggered_by_dialogue: "The conversation takes an unexpected turn...",
  };

  return messages[reason] || "The journey continues...";
};

export default {
  handleModeTransition,
  transitionFromDialogue,
  transitionFromAction,
  transitionFromExploration,
  transitionFromEncounter,
  transitionFromReflection,
  getModeTransitionMessage,
};
