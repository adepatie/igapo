/**
 * Action Manager - Generates and resolves actions across all game modes
 * Part of the Hybrid Interaction System
 */

// Base actions always available (filtered by context)
const MOVEMENT_ACTIONS = [
  {
    id: "paddle_downstream",
    category: "movement",
    label: "Paddle downstream",
    description: "Push harder to cover more distance at the cost of stamina.",
    deltas: { progress: +1, stamina: -8, supplies: -4 },
    requirements: { stamina: { min: 10 } },
  },
  {
    id: "drift",
    category: "movement",
    label: "Drift with the current",
    description: "Let the river carry you while you rest.",
    deltas: { progress: +1, stamina: +2, supplies: -2 },
    requirements: {},
  },
  {
    id: "backtrack",
    category: "movement",
    label: "Paddle upstream",
    description: "Return to a previous location (risky and exhausting).",
    deltas: { progress: -1, stamina: -15, supplies: -6 },
    requirements: { progress: { min: 1 }, stamina: { min: 20 } },
  },
  {
    id: "explore_area",
    category: "movement",
    label: "Explore this area",
    description: "Investigate the surrounding environment closely.",
    mode_transition: { to: "exploration", context: { turnsRemaining: 3 } },
    deltas: { stamina: -3 },
    requirements: {},
  },
];

const SOCIAL_ACTIONS = [
  {
    id: "seek_conversation",
    category: "social",
    label: "Strike up a conversation",
    description: "Look for someone interesting to talk with.",
    mode_transition: {
      to: "dialogue",
      context: { canExit: true, isConsequential: false },
    },
    deltas: { morale: +2 },
    requirements: {},
  },
  {
    id: "share_story",
    category: "social",
    label: "Share stories with crew",
    description: "Gather around and swap legends to bolster spirits.",
    deltas: { morale: +12, stamina: -2 },
    requirements: { morale: { max: 70 } },
  },
  {
    id: "consult_guide",
    category: "social",
    label: "Consult your guide",
    description: "Ask your indigenous guide about the area.",
    deltas: { morale: +3 },
    requirements: { crew: { includes: "guide" } },
  },
];

const SURVIVAL_ACTIONS = [
  {
    id: "forage",
    category: "survival",
    label: "Forage along the banks",
    description: "Search for fruits, fish, and medicinal herbs.",
    deltas: { supplies: +10, stamina: -4, morale: +2 },
    requirements: {},
  },
  {
    id: "camp",
    category: "survival",
    label: "Set up camp",
    description: "Rest, repair gear, and recover morale.",
    deltas: { stamina: +12, morale: +8, supplies: -8 },
    requirements: {},
  },
  {
    id: "ration_supplies",
    category: "survival",
    label: "Ration supplies",
    description: "Conserve rations to stretch supplies longer.",
    deltas: { supplies: +6, morale: -4, stamina: -2 },
    requirements: { supplies: { max: 50 } },
  },
  {
    id: "brew_tonic",
    category: "survival",
    label: "Brew restorative tonic",
    description: "Use herbs to craft a revitalizing drink.",
    deltas: { stamina: +14, supplies: -5 },
    requirements: {
      stamina: { max: 50 },
      knowledge: { includes: "herbalism" },
    },
  },
  {
    id: "hunt",
    category: "survival",
    label: "Hunt for food",
    description: "Track game through the forest (takes time and energy).",
    deltas: { supplies: +15, stamina: -8, morale: +3 },
    requirements: { stamina: { min: 15 } },
  },
];

const SPECIAL_ACTIONS = [
  {
    id: "scout_ahead",
    category: "special",
    label: "Scout ahead",
    description: "Explore upcoming bends for hazards and hidden routes.",
    deltas: { morale: +3, stamina: -3 },
    requirements: {},
  },
  {
    id: "reflect",
    category: "special",
    label: "Reflect on journey",
    description: "Take a moment to process your experiences.",
    mode_transition: { to: "reflection", context: { type: "journal" } },
    deltas: { morale: +5 },
    requirements: {},
  },
  {
    id: "use_item",
    category: "special",
    label: "Use special item",
    description: "Use an item from your inventory.",
    deltas: {},
    requirements: { inventory: { minLength: 1 } },
  },
];

const ALL_BASE_ACTIONS = [
  ...MOVEMENT_ACTIONS,
  ...SOCIAL_ACTIONS,
  ...SURVIVAL_ACTIONS,
  ...SPECIAL_ACTIONS,
];

/**
 * Check if an action's requirements are met
 */
const meetsRequirements = (state, requirements) => {
  if (!requirements) return true;

  for (const [key, condition] of Object.entries(requirements)) {
    const value = state[key];

    if (typeof condition === "object") {
      if ("min" in condition && value < condition.min) return false;
      if ("max" in condition && value > condition.max) return false;
      if ("includes" in condition) {
        if (Array.isArray(value)) {
          if (!value.includes(condition.includes)) return false;
        } else {
          return false;
        }
      }
      if ("minLength" in condition) {
        if (!Array.isArray(value) || value.length < condition.minLength)
          return false;
      }
    }
  }

  return true;
};

/**
 * Generate dynamic actions based on current context
 */
const generateDynamicActions = (state, mcpTools) => {
  const dynamic = [];
  const location = state.route[state.progress];

  // Location-specific actions
  if (location?.biome === "whitewater passage") {
    dynamic.push({
      id: "navigate_rapids",
      category: "special",
      label: "Navigate the rapids carefully",
      description: "Take your time to avoid capsizing.",
      deltas: { progress: +1, stamina: -5, supplies: -3 },
      requirements: { stamina: { min: 10 } },
    });
  }

  if (
    location?.biome === "riverside settlement" ||
    location?.biome === "riverside town"
  ) {
    dynamic.push({
      id: "trade_supplies",
      category: "social",
      label: "Trade at the settlement",
      description: "Barter for supplies and gather information.",
      deltas: { supplies: +8, morale: +4 },
      requirements: {},
    });
  }

  if (
    location?.biome === "protected wilderness" ||
    location?.biome === "towering jungle"
  ) {
    dynamic.push({
      id: "study_flora",
      category: "special",
      label: "Study the local plants",
      description: "Document unusual specimens for your expedition log.",
      deltas: { morale: +5, stamina: -2 },
      requirements: {},
    });
  }

  // Low resource emergency actions
  if (state.supplies < 20) {
    dynamic.push({
      id: "emergency_forage",
      category: "survival",
      label: "Desperate foraging",
      description: "Search frantically for anything edible.",
      deltas: { supplies: +8, stamina: -10, morale: -3 },
      requirements: {},
    });
  }

  if (state.stamina < 20 && state.supplies >= 10) {
    dynamic.push({
      id: "emergency_rest",
      category: "survival",
      label: "Emergency rest",
      description: "Stop everything and recover immediately.",
      deltas: { stamina: +20, supplies: -10, progress: 0 },
      requirements: {},
    });
  }

  return dynamic;
};

/**
 * Get all available actions for current state
 */
export const getAvailableActions = (state, mcpTools = null) => {
  const allActions = [...ALL_BASE_ACTIONS];

  // Add dynamic actions based on context
  const dynamic = generateDynamicActions(state, mcpTools);
  allActions.push(...dynamic);

  // Filter based on requirements
  const available = allActions.filter((action) =>
    meetsRequirements(state, action.requirements)
  );

  // Categorize for UI
  const categorized = {
    movement: available.filter((a) => a.category === "movement"),
    social: available.filter((a) => a.category === "social"),
    survival: available.filter((a) => a.category === "survival"),
    special: available.filter((a) => a.category === "special"),
  };

  return {
    all: available,
    categorized,
    count: available.length,
  };
};

/**
 * Get action by ID
 */
export const getActionById = (actionId) => {
  return ALL_BASE_ACTIONS.find((a) => a.id === actionId);
};

/**
 * Resolve an action and return updated state + mode transition info
 */
export const resolveAction = (state, actionId, mcpTools = null) => {
  const action = getActionById(actionId);

  if (!action) {
    // Check dynamic actions
    const dynamic = generateDynamicActions(state, mcpTools);
    const dynamicAction = dynamic.find((a) => a.id === actionId);
    if (!dynamicAction) {
      throw new Error(`Unknown action: ${actionId}`);
    }
    return resolveActionInternal(state, dynamicAction, mcpTools);
  }

  return resolveActionInternal(state, action, mcpTools);
};

const resolveActionInternal = (state, action, mcpTools) => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  // Apply deltas
  let nextState = { ...state };
  const deltas = action.deltas || {};

  nextState.stamina = clamp(nextState.stamina + (deltas.stamina || 0), 0, 100);
  nextState.morale = clamp(nextState.morale + (deltas.morale || 0), 0, 100);
  nextState.supplies = Math.max(0, nextState.supplies + (deltas.supplies || 0));
  nextState.progress = clamp(
    nextState.progress + (deltas.progress || 0),
    0,
    nextState.route.length - 1
  );

  // Record action in journal
  const location = nextState.route[nextState.progress];
  nextState.journal = [
    ...nextState.journal,
    {
      turn: nextState.journal.length + 1,
      action: action.id,
      label: action.label,
      location: location?.name,
      deltas,
      timestamp: new Date().toISOString(),
    },
  ];

  // Update last action
  nextState.lastAction = action;

  // Handle mode transitions
  let modeTransition = null;
  if (action.mode_transition) {
    modeTransition = action.mode_transition;
    nextState.currentMode = action.mode_transition.to;

    // Update mode context
    if (action.mode_transition.context) {
      nextState.modeContext[action.mode_transition.to] = {
        ...nextState.modeContext[action.mode_transition.to],
        ...action.mode_transition.context,
      };
    }
  } else {
    // Default: stay in action mode
    nextState.currentMode = "action";
  }

  // Check for status changes
  if (
    nextState.supplies <= 0 ||
    nextState.stamina <= 0 ||
    nextState.morale <= 0
  ) {
    nextState.status = "failed";
  } else if (nextState.progress >= nextState.route.length - 1) {
    nextState.status = "arrived";
  } else {
    nextState.status = "ongoing";
  }

  return {
    state: nextState,
    action,
    modeTransition,
    message: generateActionMessage(action, deltas, location),
  };
};

const generateActionMessage = (action, deltas, location) => {
  let message = action.description;

  // Add delta feedback
  const effects = [];
  if (deltas.stamina > 0) effects.push(`+${deltas.stamina} stamina`);
  if (deltas.stamina < 0) effects.push(`${deltas.stamina} stamina`);
  if (deltas.morale > 0) effects.push(`+${deltas.morale} morale`);
  if (deltas.morale < 0) effects.push(`${deltas.morale} morale`);
  if (deltas.supplies > 0) effects.push(`+${deltas.supplies} supplies`);
  if (deltas.supplies < 0) effects.push(`${deltas.supplies} supplies`);
  if (deltas.progress !== 0) {
    effects.push(deltas.progress > 0 ? "moved forward" : "moved backward");
  }

  if (effects.length > 0) {
    message += " (" + effects.join(", ") + ")";
  }

  return message;
};

export default {
  getAvailableActions,
  getActionById,
  resolveAction,
};
