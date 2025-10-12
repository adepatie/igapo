import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { createInitialState, applyAction } from "./game/stateManager.js";
import { Narrator } from "./gpt/narrator.js";
import { DialogueNarrator } from "./gpt/dialogueNarrator.js";
import { initializeDatabase } from "./database/initDatabase.js";
import {
  getCharacterForScene,
  getCharacterById,
  parseCharacterData,
} from "./database/characterQueries.js";
import { registerAllTools } from "./mcp/server.js";
import {
  validatePlayerName,
  validateGameState,
  validateCharacterId,
  validationErrorHandler,
  asyncHandler,
  ValidationError,
} from "./utils/validation.js";
import {
  createSession,
  getSessionDb,
  clearSession,
  clearPlayerSessions,
  startSessionCleanup,
} from "./game/sessionManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["ANTHROPIC_API_KEY"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  console.error("Please create a .env file with the required variables.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = initializeDatabase();
console.log("✅ Database initialized with Amazon data");

// MCP tools will be initialized async
let mcpTools = null;

const JOURNEY_LOCATIONS = [
  {
    name: "Manaus Docks",
    biome: "confluence",
    description:
      "Steam rises where the Rio Negro meets the Solimões, painting a line of bronze across the water.",
    fact: "The Meeting of Waters flows side by side for nearly 6 kilometers before mixing.",
    outcome: "calm",
  },
  {
    name: "Anavilhanas Archipelago",
    biome: "rainforest",
    description:
      "A maze of 400 emerald islands scatters moonlight into silver trails.",
    fact: "Anavilhanas is one of the world's largest freshwater archipelagos, home to pink river dolphins.",
    outcome: "mystery",
  },
  {
    name: "Tapajós Tributary",
    biome: "white-sand forest",
    description:
      "Quiet sandbars glow ivory while forest cicadas pulse like a heartbeat in the canopy.",
    fact: "Tapajós waters run clear thanks to ancient sandstone filtering the flow for millennia.",
    outcome: "success",
  },
];

const JOURNEY_FACTS = [
  "The Amazon River moves 20% of Earth's fresh river water into the Atlantic.",
  "Over 400 indigenous groups call the Amazon basin home, each with distinct languages.",
  "Giant kapok trees can tower 200 feet, sheltering entire vertical ecosystems in their branches.",
  "Pink river dolphins use echolocation to navigate flooded forests during the wet season.",
  "The rainforest canopy recycles half of its rainfall back into the atmosphere each day.",
];

const JOURNEY_CHOICES = [
  {
    id: "chart-tributary",
    label: "Chart a hidden tributary",
    description: "Skim the flooded groves for a faster route",
    mood: "mystery",
    deltas: { morale: 2, stamina: -4, supplies: -2 },
  },
  {
    id: "collect-specimens",
    label: "Collect specimens",
    description: "Document flora with the science crew",
    mood: "success",
    deltas: { morale: 3, stamina: -3, supplies: -1 },
  },
  {
    id: "set-camp",
    label: "Set camp and rest",
    description: "Let hammocks swing between buttress roots",
    mood: "calm",
    deltas: { morale: 1, stamina: 5, supplies: -3 },
  },
];

const journeySessions = new Map();

function toNumberSeed(seedValue) {
  let hash = 1779033703 ^ seedValue.length;
  for (let i = 0; i < seedValue.length; i += 1) {
    hash = Math.imul(hash ^ seedValue.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  hash =
    Math.imul(hash ^ (hash >>> 16), 2246822507) ^
    Math.imul(hash ^ (hash >>> 13), 3266489909);
  return (hash ^= hash >>> 16) >>> 0;
}

function mulberry32(a) {
  return function rng() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickFrom(array, rng) {
  return array[Math.floor(rng() * array.length) % array.length];
}

function computeStateHash(seed, step, choiceId) {
  return createHash("sha256")
    .update(`${seed}:${step}:${choiceId ?? "start"}`)
    .digest("hex")
    .slice(0, 16);
}

function buildJourneyState({ seed, step, previousJournal }, choiceId) {
  const key = `${seed}:${step}:${choiceId ?? "start"}`;
  const rng = mulberry32(toNumberSeed(key));
  const day = step + 1;
  const location = pickFrom(JOURNEY_LOCATIONS, rng);
  const fact = pickFrom(JOURNEY_FACTS, rng);
  const baseChoiceSet = JOURNEY_CHOICES.map((choice) => ({
    ...choice,
    mood: choice.mood,
  }));
  for (let i = baseChoiceSet.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [baseChoiceSet[i], baseChoiceSet[j]] = [baseChoiceSet[j], baseChoiceSet[i]];
  }

  const appliedDeltas = choiceId
    ? JOURNEY_CHOICES.find((choice) => choice.id === choiceId)?.deltas ?? {
        morale: 0,
        stamina: 0,
        supplies: 0,
      }
    : { morale: 0, stamina: 0, supplies: 0 };

  const morale = Math.min(
    100,
    Math.max(0, 70 + Math.round(rng() * 10) + appliedDeltas.morale)
  );
  const stamina = Math.min(
    100,
    Math.max(0, 65 + Math.round(rng() * 12) + appliedDeltas.stamina)
  );
  const supplies = Math.max(
    0,
    55 + Math.round(rng() * 8) + appliedDeltas.supplies
  );

  const journalEntries = previousJournal ? [...previousJournal] : [];
  if (choiceId) {
    journalEntries.push({
      id: `journal-${day}`,
      day,
      text: `Day ${day}: Chose ${choiceId.replace(/-/g, " ")}. ${
        location.description
      }`,
    });
  }

  const stateHash = computeStateHash(seed, step, choiceId);

  const state = {
    hash: stateHash,
    day,
    location: location.name,
    biome: location.biome,
    morale,
    stamina,
    supplies,
    outcome: choiceId
      ? JOURNEY_CHOICES.find((choice) => choice.id === choiceId)?.mood ??
        location.outcome
      : location.outcome,
    choices: baseChoiceSet,
    facts: [fact],
    journal: journalEntries,
  };

  const prose = {
    title: `${location.name}, Day ${day}`,
    summary: `The expedition drifts past ${location.name}, where ${fact}`,
    paragraphs: [
      `Crew morale steadies as ${location.description}`,
      choiceId
        ? `Your decision to ${choiceId.replace(
            /-/g,
            " "
          )} reveals new currents threading toward the legendary Lágrimas da Lua.`
        : `Rumors along the river whisper of the Lágrimas da Lua blooming deeper in the basin.`,
    ],
    outcome: state.outcome,
    facts: [fact],
  };

  return { state, prose };
}

function createJourney(seed) {
  const normalizedSeed = seed?.toString().trim() || "default-seed";
  const { state, prose } = buildJourneyState({
    seed: normalizedSeed,
    step: 0,
    previousJournal: [],
  });

  journeySessions.set(state.hash, {
    seed: normalizedSeed,
    step: 1,
    journal: state.journal,
  });

  return { state, prose };
}

function advanceJourney(previousHash, choiceId) {
  const session = journeySessions.get(previousHash);
  if (!session) {
    return null;
  }

  const { state, prose } = buildJourneyState(
    {
      seed: session.seed,
      step: session.step,
      previousJournal: session.journal,
    },
    choiceId
  );

  journeySessions.delete(previousHash);
  journeySessions.set(state.hash, {
    seed: session.seed,
    step: session.step + 1,
    journal: state.journal,
  });

  return { state, prose };
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize narrators (will be updated with MCP tools after server starts)
const narrator = new Narrator();
let dialogueNarrator = new DialogueNarrator();

app.get("/start", (req, res) => {
  try {
    const { seed } = req.query;
    const payload = createJourney(seed ? String(seed) : undefined);
    return res.json(payload);
  } catch (error) {
    console.error("Error creating journey:", error);
    return res.status(500).json({
      error: "Failed to launch the expedition. Please try again.",
    });
  }
});

app.post("/turn", (req, res) => {
  const { choice_id: choiceId, prev_state_hash: previousHash } = req.body ?? {};
  if (!choiceId || !previousHash) {
    return res.status(400).json({
      error: "choice_id and prev_state_hash are required.",
    });
  }

  const result = advanceJourney(previousHash, String(choiceId));
  if (!result) {
    return res.status(409).json({
      error: "The expedition state was not found. Restart the journey.",
    });
  }

  return res.json(result);
});

// Health check endpoints
app.get("/healthz", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Helper to transform state to match frontend expectations
function transformStateForFrontend(state) {
  const location = state.route[state.progress] || state.route[0];
  return {
    ...state,
    location: location.name,
    biome: location.biome,
    status: state.status === "ongoing" ? "active" : state.status,
  };
}

// DIALOGUE-BASED API ENDPOINTS

// Start a new game with dialogue scene
app.post(
  "/api/dialogue/start",
  asyncHandler(async (req, res) => {
    // Validate input
    const validatedPlayerName = validatePlayerName(req.body.playerName);

    // Create a new session for this player
    const session = createSession(validatedPlayerName);
    console.log(
      `[API] Created session ${session.sessionId} for ${validatedPlayerName}`
    );

    // Create initial game state with session ID
    const state = createInitialState(validatedPlayerName, session.sessionId);
    const transformedState = transformStateForFrontend(state);

    // Get a character for the opening scene
    const rawCharacter = getCharacterForScene({
      location: transformedState.location,
      rolePreference: "guide", // Start with a guide for the intro
    });

    const character = parseCharacterData(rawCharacter);

    // Get session database for MCP tools
    const sessionDb = getSessionDb(session.sessionId);

    // Generate opening dialogue with player ID and session for MCP tracking
    const dialogueData = await dialogueNarrator.generateIntroDialogue({
      character,
      state: transformedState,
      location: transformedState.location,
      playerId: validatedPlayerName,
      sessionDb, // Pass session DB for character relationships
    });

    // Return complete dialogue scene
    res.json({
      state: transformedState,
      dialogue: {
        ...dialogueData.dialogue,
        character: {
          id: character.id,
          name: character.name,
          role: character.role,
          archetype: character.archetype,
          description: character.description,
          backgroundImage: character.background_image,
        },
        options: dialogueData.options,
        location: transformedState.location,
        timeOfDay: "daytime", // TODO: Will be dynamic when day/night cycle is implemented
      },
    });
  })
);

// Continue a dialogue conversation
app.post(
  "/api/dialogue/continue",
  asyncHandler(async (req, res) => {
    // Validate input
    const validatedState = validateGameState(req.body.state);
    const validatedCharacterId = validateCharacterId(req.body.characterId);

    if (!req.body.selectedOptionId) {
      throw new ValidationError(
        "Selected option ID is required",
        "selectedOptionId"
      );
    }

    // Validate session ID
    if (!validatedState.sessionId) {
      throw new ValidationError("Session ID is required", "sessionId");
    }

    const { selectedOptionId, previousDialogue } = req.body;

    // Get session database
    const sessionDb = getSessionDb(validatedState.sessionId);
    if (!sessionDb) {
      throw new ValidationError(
        "Session not found. Please start a new game.",
        "sessionId"
      );
    }

    // Get the character
    const rawCharacter = getCharacterById(validatedCharacterId);
    if (!rawCharacter) {
      return res.status(404).json({ error: "Character not found" });
    }

    const character = parseCharacterData(rawCharacter);

    // Find the selected option (would be passed from frontend)
    const selectedOption = {
      id: selectedOptionId,
      text: req.body.selectedOptionText || "Continue...",
      tone: req.body.selectedOptionTone || "neutral",
    };

    // Generate follow-up dialogue with MCP tracking and session DB
    const dialogueData = await dialogueNarrator.generateFollowUpDialogue({
      character,
      state: validatedState,
      selectedOption,
      previousDialogue: previousDialogue || "",
      playerId: validatedState.playerName,
      turnNumber: req.body.turnNumber || 2,
      sessionDb, // Pass session DB for character relationships
    });

    res.json({
      dialogue: {
        ...dialogueData.dialogue,
        character: {
          id: character.id,
          name: character.name,
          role: character.role,
          archetype: character.archetype,
          description: character.description,
          backgroundImage: character.background_image,
        },
        options: dialogueData.options,
        conversationEnds: dialogueData.conversationEnds || false,
      },
    });
  })
);

// Get a new character for a scene
app.post(
  "/api/dialogue/new-character",
  asyncHandler(async (req, res) => {
    // Validate input
    const validatedState = validateGameState(req.body.state);

    // Validate session ID
    if (!validatedState.sessionId) {
      throw new ValidationError("Session ID is required", "sessionId");
    }

    const { rolePreference, excludeIds } = req.body;

    // Get session database
    const sessionDb = getSessionDb(validatedState.sessionId);
    if (!sessionDb) {
      throw new ValidationError(
        "Session not found. Please start a new game.",
        "sessionId"
      );
    }

    const rawCharacter = getCharacterForScene({
      location: validatedState.location,
      rolePreference,
      excludeIds: excludeIds || [],
    });

    const character = parseCharacterData(rawCharacter);

    // Generate intro dialogue with this character, MCP tracking, and session DB
    const dialogueData = await dialogueNarrator.generateIntroDialogue({
      character,
      state: validatedState,
      location: validatedState.location,
      playerId: validatedState.playerName,
      sessionDb, // Pass session DB for character relationships
    });

    res.json({
      dialogue: {
        ...dialogueData.dialogue,
        character: {
          id: character.id,
          name: character.name,
          role: character.role,
          archetype: character.archetype,
          description: character.description,
          backgroundImage: character.background_image,
        },
        options: dialogueData.options,
        location: validatedState.location,
        timeOfDay: "daytime", // TODO: Will be dynamic when day/night cycle is implemented
      },
    });
  })
);

// TODO: getTimeOfDay function will be implemented when day/night cycle is added
// function getTimeOfDay(daysElapsed) {
//   const times = ["dawn", "morning", "midday", "afternoon", "dusk", "evening"];
//   return times[daysElapsed % times.length];
// }

// SESSION MANAGEMENT API ENDPOINTS

// Reset session (for game restart)
app.post(
  "/api/session/reset",
  asyncHandler(async (req, res) => {
    const { playerName, sessionId } = req.body;

    if (!sessionId) {
      throw new ValidationError("Session ID is required", "sessionId");
    }

    // Clear the old session
    const cleared = clearSession(sessionId);

    if (!cleared) {
      console.warn(`[API] Could not clear session ${sessionId}`);
    }

    // Create a new session
    const newSession = createSession(playerName || "Explorer");
    console.log(
      `[API] Reset session: old=${sessionId}, new=${newSession.sessionId}`
    );

    res.json({
      sessionId: newSession.sessionId,
      message: "Session reset successfully",
    });
  })
);

// Clear all sessions for a player (admin/debug)
app.post(
  "/api/session/clear-player",
  asyncHandler(async (req, res) => {
    const { playerName } = req.body;

    if (!playerName) {
      throw new ValidationError("Player name is required", "playerName");
    }

    const cleared = clearPlayerSessions(playerName);

    res.json({
      cleared,
      message: `Cleared ${cleared} session(s) for ${playerName}`,
    });
  })
);

// HYBRID SYSTEM API ENDPOINTS

import { getAvailableActions, resolveAction } from "./game/actionManager.js";
import {
  handleModeTransition,
  getModeTransitionMessage,
} from "./game/modeManager.js";

// Get available actions for current state
app.post(
  "/api/actions/list",
  asyncHandler(async (req, res) => {
    const validatedState = validateGameState(req.body.state);

    // Get MCP tools if available
    const mcpTools = req.app.locals.mcpTools || null;

    const actions = getAvailableActions(validatedState, mcpTools);

    res.json({
      actions: actions.categorized,
      total: actions.count,
      currentMode: validatedState.currentMode,
      location: validatedState.route[validatedState.progress],
    });
  })
);

// Execute an action
app.post(
  "/api/actions/execute",
  asyncHandler(async (req, res) => {
    const validatedState = validateGameState(req.body.state);
    const { actionId } = req.body;

    if (!actionId) {
      throw new ValidationError("Action ID is required", "actionId");
    }

    // Get MCP tools if available
    const mcpTools = req.app.locals.mcpTools || null;

    // Resolve the action
    const result = resolveAction(validatedState, actionId, mcpTools);

    // Handle mode transition
    const transition = handleModeTransition(result.state, "action", result);
    const transitionMessage = getModeTransitionMessage(
      "action",
      transition.mode,
      transition.reason
    );

    // Transform state for frontend
    const transformedState = transformStateForFrontend(transition.state);

    res.json({
      state: transformedState,
      action: result.action,
      message: result.message,
      modeTransition: {
        from: "action",
        to: transition.mode,
        reason: transition.reason,
        message: transitionMessage,
      },
    });
  })
);

// Transition from dialogue to another mode
app.post(
  "/api/modes/transition-from-dialogue",
  asyncHandler(async (req, res) => {
    const validatedState = validateGameState(req.body.state);
    const { dialogueResult } = req.body;

    // Get session database if transitioning to dialogue
    let sessionDb = null;
    if (validatedState.sessionId) {
      sessionDb = getSessionDb(validatedState.sessionId);
    }

    const transition = handleModeTransition(
      validatedState,
      "dialogue",
      dialogueResult || {}
    );
    const transitionMessage = getModeTransitionMessage(
      "dialogue",
      transition.mode,
      transition.reason
    );

    const transformedState = transformStateForFrontend(transition.state);

    // If transitioning to dialogue, get a new character
    if (transition.mode === "dialogue") {
      if (!sessionDb) {
        throw new ValidationError(
          "Session not found. Please start a new game.",
          "sessionId"
        );
      }

      const excludeIds = req.body.excludeIds || [];
      const rawCharacter = getCharacterForScene({
        location: transformedState.location,
        excludeIds,
      });

      const character = parseCharacterData(rawCharacter);

      // Determine if this should be consequential
      const dialogueType = dialogueNarrator.analyzeDialogueType(
        character,
        transformedState,
        null
      );

      let dialogueData;
      if (dialogueType.isConsequential) {
        // Generate consequential dialogue
        const consequenceTypes = ["reveal", "quest", "crisis", "opportunity"];
        const randomType =
          consequenceTypes[Math.floor(Math.random() * consequenceTypes.length)];

        dialogueData = await dialogueNarrator.generateConsequentialDialogue({
          character,
          state: transformedState,
          location: transformedState.location,
          playerId: transformedState.playerName,
          consequenceType: randomType,
          sessionDb, // Pass session DB
        });
      } else {
        // Generate regular conversational dialogue
        dialogueData = await dialogueNarrator.generateIntroDialogue({
          character,
          state: transformedState,
          location: transformedState.location,
          playerId: transformedState.playerName,
          sessionDb, // Pass session DB
        });
      }

      return res.json({
        state: transformedState,
        modeTransition: {
          from: "dialogue",
          to: "dialogue",
          reason: transition.reason,
          message: transitionMessage,
        },
        dialogue: {
          ...dialogueData.dialogue,
          character: {
            id: character.id,
            name: character.name,
            role: character.role,
            archetype: character.archetype,
            description: character.description,
            backgroundImage: character.background_image,
          },
          options: dialogueData.options,
          isConsequential: dialogueData.isConsequential || false,
          consequenceType: dialogueData.consequenceType,
          location: transformedState.location,
        },
      });
    }

    res.json({
      state: transformedState,
      modeTransition: {
        from: "dialogue",
        to: transition.mode,
        reason: transition.reason,
        message: transitionMessage,
      },
    });
  })
);

// Start exploration mode
app.post(
  "/api/exploration/start",
  asyncHandler(async (req, res) => {
    const validatedState = validateGameState(req.body.state);

    // Update mode
    validatedState.currentMode = "exploration";
    validatedState.modeContext.exploration = {
      areaId: `area_${validatedState.progress}_${Date.now()}`,
      itemsFound: [],
      turnsRemaining: 3,
    };

    const location = validatedState.route[validatedState.progress];

    res.json({
      state: transformStateForFrontend(validatedState),
      exploration: {
        location,
        description: `You begin to explore the ${location.biome} around ${location.name}.`,
        turnsRemaining: 3,
      },
    });
  })
);

// Explore (take a turn exploring)
app.post(
  "/api/exploration/explore",
  asyncHandler(async (req, res) => {
    const validatedState = validateGameState(req.body.state);
    const { action } = req.body; // "search" | "observe" | "rest" | "leave"

    const exploration = validatedState.modeContext.exploration;
    exploration.turnsRemaining -= 1;

    // Simulate findings (in a full implementation, this would be more sophisticated)
    const findings = {
      search: { items: ["medicinal herb"], supplies: +5, stamina: -3 },
      observe: { knowledge: ["bird migration pattern"], morale: +3 },
      rest: { stamina: +8, supplies: -2 },
      leave: { turnsRemaining: 0 },
    };

    const result = findings[action] || findings.leave;

    // Apply changes
    if (result.supplies) validatedState.supplies += result.supplies;
    if (result.stamina)
      validatedState.stamina = Math.min(
        100,
        Math.max(0, validatedState.stamina + result.stamina)
      );
    if (result.morale)
      validatedState.morale = Math.min(
        100,
        Math.max(0, validatedState.morale + result.morale)
      );
    if (result.items) {
      validatedState.inventory.push(...result.items);
      exploration.itemsFound.push(...result.items);
    }
    if (result.knowledge) validatedState.knowledge.push(...result.knowledge);

    // Check if exploration is complete
    let modeTransition = null;
    if (exploration.turnsRemaining <= 0 || action === "leave") {
      const transition = handleModeTransition(validatedState, "exploration", {
        itemsFound: exploration.itemsFound,
        knowledgeGained: result.knowledge || [],
      });
      modeTransition = {
        from: "exploration",
        to: transition.mode,
        reason: transition.reason,
        message: getModeTransitionMessage(
          "exploration",
          transition.mode,
          transition.reason
        ),
      };
      validatedState.currentMode = transition.mode;
    }

    res.json({
      state: transformStateForFrontend(validatedState),
      result: {
        action,
        findings: result,
        turnsRemaining: exploration.turnsRemaining,
      },
      modeTransition,
    });
  })
);

// ORIGINAL API ENDPOINTS (for backward compatibility)

// Start a new game
app.post("/api/start", async (req, res) => {
  try {
    const { playerName } = req.body;
    if (!playerName) {
      return res.status(400).json({ error: "Player name is required" });
    }

    const state = createInitialState(playerName);
    const transformedState = transformStateForFrontend(state);
    res.json({ state: transformedState });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get available actions for current state (legacy endpoint - for backward compatibility)
app.post("/api/actions", async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: "State is required" });
    }

    const mcpTools = req.app.locals.mcpTools || null;
    const result = getAvailableActions(state, mcpTools);
    // Return in old format for backward compatibility
    res.json({ actions: result.all });
  } catch (error) {
    console.error("Error getting actions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Perform an action
app.post("/api/action", async (req, res) => {
  try {
    const { state, actionId } = req.body;
    if (!state || !actionId) {
      return res.status(400).json({ error: "State and actionId are required" });
    }

    const result = applyAction(state, actionId);
    const transformedState = transformStateForFrontend(result.state);

    // Build context for narration
    const context = {
      stateSummary: {
        location: transformedState.location,
        biome: transformedState.biome,
        morale: transformedState.morale,
        stamina: transformedState.stamina,
        supplies: transformedState.supplies,
        // daysElapsed: transformedState.daysElapsed, // TODO: Will be tracked when camping is implemented
        status: transformedState.status,
      },
      encounter: result.encounter,
      action: result.action,
    };

    res.json({
      state: transformedState,
      context,
    });
  } catch (error) {
    console.error("Error performing action:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get narration for intro or turn
app.post("/api/narrate", async (req, res) => {
  try {
    const { type, state, context } = req.body;

    let narrative;
    if (type === "intro") {
      if (!state) {
        return res.status(400).json({ error: "State is required for intro" });
      }
      narrative = await narrator.intro({ state });
    } else if (type === "turn") {
      if (!context) {
        return res.status(400).json({ error: "Context is required for turn" });
      }
      narrative = await narrator.narrateTurn(context);
    } else {
      return res.status(400).json({ error: "Invalid narration type" });
    }

    res.json({ narrative });
  } catch (error) {
    console.error("Error generating narration:", error);
    res.status(500).json({ error: error.message });
  }
});

// Generate dynamic story turn with choices
app.post("/api/dynamic-turn", async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: "State is required" });
    }

    const turnData = await narrator.generateDynamicTurn(state, mcpTools);

    console.log("Turn data from narrator:", {
      hasAnimalName: !!turnData.animalName,
      animalName: turnData.animalName,
      scientificName: turnData.scientificName,
    });

    // If an animal is featured, look up its image from the database
    if (turnData.animalName && turnData.scientificName) {
      try {
        const animal = db
          .prepare(
            "SELECT image_url FROM animals WHERE common_name = ? AND scientific_name = ?"
          )
          .get(turnData.animalName, turnData.scientificName);

        console.log("Database lookup result:", animal);

        if (animal && animal.image_url) {
          turnData.animalImage = animal.image_url;
          console.log("Added image URL to turn data:", turnData.animalImage);
        } else {
          console.log("No animal found in database for:", turnData.animalName);
        }
      } catch (dbError) {
        console.error("Failed to look up animal image:", dbError);
        // Continue without image if lookup fails
      }
    } else {
      console.log("No animal name in turn data");
    }

    res.json(turnData);
  } catch (error) {
    console.error("Error generating dynamic turn:", error);
    res.status(500).json({ error: error.message });
  }
});

// Apply a dynamic choice
app.post("/api/apply-choice", async (req, res) => {
  try {
    const { state, choice } = req.body;
    if (!state || !choice) {
      return res.status(400).json({ error: "State and choice are required" });
    }

    // Apply deltas from choice
    const nextState = { ...state };
    const deltas = choice.deltas || {};

    nextState.morale = Math.max(
      0,
      Math.min(100, nextState.morale + (deltas.morale || 0))
    );
    nextState.stamina = Math.max(
      0,
      Math.min(100, nextState.stamina + (deltas.stamina || 0))
    );
    nextState.supplies = Math.max(
      0,
      nextState.supplies + (deltas.supplies || 0)
    );
    nextState.progress = Math.max(
      0,
      Math.min(
        nextState.route.length - 1,
        nextState.progress + (deltas.progress || 0)
      )
    );
    // nextState.daysElapsed += 1; // TODO: Will be tracked when camping is implemented
    nextState.lastAction = {
      label: choice.label,
      description: choice.description,
    };

    // Handle rewards (items, crew, knowledge, events)
    let rewardMessage = null;
    if (choice.reward) {
      const reward = choice.reward;

      switch (reward.type) {
        case "item":
          if (!nextState.inventory) nextState.inventory = [];
          nextState.inventory.push(reward.value);
          rewardMessage = `📦 Gained: ${reward.value}`;
          break;

        case "crew":
          if (!nextState.crew) nextState.crew = [];
          nextState.crew.push(reward.value);
          rewardMessage = `👥 ${reward.value} joins your expedition!`;
          break;

        case "knowledge":
          if (!nextState.knowledge) nextState.knowledge = [];
          nextState.knowledge.push(reward.value);
          rewardMessage = `💡 Learned: ${reward.value}`;
          break;

        case "event":
          // Events trigger follow-up narratives
          rewardMessage = reward.narrative || reward.value;
          break;

        case "stat":
          // Additional stat bonuses beyond the deltas
          rewardMessage = reward.narrative || `✨ ${reward.value}`;
          break;
      }

      // Add narrative from reward if present
      if (reward.narrative && reward.type !== "event") {
        rewardMessage = reward.narrative;
      }
    }

    // Add to journal
    nextState.journal.push({
      kind: "choice",
      choice: choice,
      reward: choice.reward,
      timestamp: Date.now(),
    });

    // Determine status
    if (
      nextState.supplies <= 0 ||
      nextState.stamina <= 0 ||
      nextState.morale <= 0
    ) {
      nextState.status = "failed";
    } else if (
      nextState.progress >=
      nextState.route.length - 1
      // TODO: Add time requirement when camping is implemented (e.g., && nextState.daysElapsed >= 10)
    ) {
      // Must reach final location
      nextState.status = "complete";
    } else {
      nextState.status = "ongoing";
    }

    res.json({
      state: nextState,
      rewardMessage: rewardMessage,
    });
  } catch (error) {
    console.error("Error applying choice:", error);
    res.status(500).json({ error: error.message });
  }
});

// Phase 1: Supply Management API Endpoints
app.get(
  "/api/supplies",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const supplies = sessionDb
      .prepare(
        `
      SELECT supply_type, quantity, max_capacity, last_consumed 
      FROM session_supplies 
      WHERE session_id = ?
    `
      )
      .all(sessionId);

    // Convert to object format
    const suppliesObj = {};
    supplies.forEach((row) => {
      suppliesObj[row.supply_type] = {
        current: row.quantity,
        max: row.max_capacity,
        lastConsumed: row.last_consumed,
      };
    });

    res.json({ supplies: suppliesObj });
  })
);

app.post(
  "/api/supplies/consume",
  asyncHandler(async (req, res) => {
    const { sessionId, type, amount } = req.body;

    if (!sessionId || !type || typeof amount !== "number") {
      throw new ValidationError("sessionId, type, and amount are required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const currentTime = Math.floor(Date.now() / 1000);

    // Update supply quantity
    const result = sessionDb
      .prepare(
        `
      UPDATE session_supplies 
      SET quantity = MAX(0, quantity - ?), last_consumed = ?
      WHERE session_id = ? AND supply_type = ?
    `
      )
      .run(amount, currentTime, sessionId, type);

    if (result.changes === 0) {
      throw new ValidationError("Supply type not found");
    }

    // Get updated supply data
    const updatedSupply = sessionDb
      .prepare(
        `
      SELECT supply_type, quantity, max_capacity, last_consumed 
      FROM session_supplies 
      WHERE session_id = ? AND supply_type = ?
    `
      )
      .get(sessionId, type);

    res.json({
      success: true,
      supply: {
        type: updatedSupply.supply_type,
        current: updatedSupply.quantity,
        max: updatedSupply.max_capacity,
        lastConsumed: updatedSupply.last_consumed,
      },
    });
  })
);

// Phase 1: Survival Status API Endpoint
app.get(
  "/api/survival/status",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const survival = sessionDb
      .prepare(
        `
      SELECT last_food_consumption, last_water_consumption, 
             starvation_stage, dehydration_stage, survival_modifiers
      FROM session_survival 
      WHERE session_id = ?
    `
      )
      .get(sessionId);

    if (!survival) {
      // Return default survival state
      res.json({
        survival: {
          lastFoodConsumption: Math.floor(Date.now() / 1000),
          lastWaterConsumption: Math.floor(Date.now() / 1000),
          starvationStage: 0,
          dehydrationStage: 0,
          survivalModifiers: {},
          timeRemaining: {
            dehydration: 72 * 3600,
            starvation: 21 * 24 * 3600,
          },
        },
      });
      return;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceWater = currentTime - survival.last_water_consumption;
    const timeSinceFood = currentTime - survival.last_food_consumption;

    res.json({
      survival: {
        lastFoodConsumption: survival.last_food_consumption,
        lastWaterConsumption: survival.last_water_consumption,
        starvationStage: survival.starvation_stage,
        dehydrationStage: survival.dehydration_stage,
        survivalModifiers: JSON.parse(survival.survival_modifiers || "{}"),
        timeRemaining: {
          dehydration: Math.max(0, 72 * 3600 - timeSinceWater),
          starvation: Math.max(0, 21 * 24 * 3600 - timeSinceFood),
        },
      },
    });
  })
);

// Phase 2: Party Management API Endpoints
app.get(
  "/api/party",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const party = sessionDb
      .prepare(
        `
      SELECT character_id, role, skills, stats, reputation_groups, 
             recruited_at, languages
      FROM session_party 
      WHERE session_id = ?
    `
      )
      .all(sessionId);

    // Convert to PartyMember format
    const partyMembers = party.map((row) => ({
      characterId: row.character_id,
      name: row.character_id, // TODO: Get actual name from character data
      role: row.role,
      skills: JSON.parse(row.skills || "[]"),
      stats: JSON.parse(row.stats || "{}"),
      reputationGroups: JSON.parse(row.reputation_groups || "{}"),
      recruitedAt: row.recruited_at,
      languages: JSON.parse(row.languages || "[]"),
    }));

    res.json({ party: partyMembers });
  })
);

app.post(
  "/api/party/recruit",
  asyncHandler(async (req, res) => {
    const { sessionId, characterData } = req.body;

    if (!sessionId || !characterData) {
      throw new ValidationError("sessionId and characterData are required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const currentTime = Math.floor(Date.now() / 1000);

    // Insert new party member
    sessionDb
      .prepare(
        `
      INSERT INTO session_party 
      (session_id, character_id, role, skills, stats, reputation_groups, recruited_at, languages)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        sessionId,
        characterData.id,
        characterData.role || "companion",
        JSON.stringify(characterData.skills || []),
        JSON.stringify({
          morale: characterData.morale || 75,
          trustworthiness: characterData.trustworthiness || 50,
          charisma: characterData.charisma || 60,
          strength: characterData.strength || 70,
          knowledge: characterData.knowledge || 65,
          instincts: characterData.instincts || 55,
          playerLiking: characterData.playerLiking || 50,
        }),
        JSON.stringify(characterData.reputationGroups || {}),
        currentTime,
        JSON.stringify(characterData.languages || ["Portuguese"])
      );

    res.json({ success: true, message: "Party member recruited" });
  })
);

app.delete(
  "/api/party/:characterId",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.query;
    const { characterId } = req.params;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const result = sessionDb
      .prepare(
        `
      DELETE FROM session_party 
      WHERE session_id = ? AND character_id = ?
    `
      )
      .run(sessionId, characterId);

    if (result.changes === 0) {
      throw new ValidationError("Party member not found");
    }

    res.json({ success: true, message: "Party member dismissed" });
  })
);

// Phase 2: Economy API Endpoints
app.get(
  "/api/economy",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const economy = sessionDb
      .prepare(
        `
      SELECT currency_amount, barter_goods
      FROM session_economy 
      WHERE session_id = ?
    `
      )
      .get(sessionId);

    if (!economy) {
      // Return default economy state
      res.json({
        economy: {
          currencyAmount: 1000,
          barterGoods: {},
        },
      });
      return;
    }

    res.json({
      economy: {
        currencyAmount: economy.currency_amount,
        barterGoods: JSON.parse(economy.barter_goods || "{}"),
      },
    });
  })
);

app.post(
  "/api/economy/trade",
  asyncHandler(async (req, res) => {
    const { sessionId, tradeData } = req.body;

    if (!sessionId || !tradeData) {
      throw new ValidationError("sessionId and tradeData are required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const { type, item, quantity, price } = tradeData;
    const totalCost = price * quantity;

    // Get current economy state
    const economy = sessionDb
      .prepare(
        `
      SELECT currency_amount, barter_goods
      FROM session_economy 
      WHERE session_id = ?
    `
      )
      .get(sessionId);

    if (!economy) {
      throw new ValidationError("Economy state not found");
    }

    const currentCurrency = economy.currency_amount;
    const currentBarterGoods = JSON.parse(economy.barter_goods || "{}");

    if (type === "buy") {
      if (currentCurrency < totalCost) {
        throw new ValidationError("Insufficient funds");
      }

      // Update currency
      sessionDb
        .prepare(
          `
        UPDATE session_economy 
        SET currency_amount = currency_amount - ?
        WHERE session_id = ?
      `
        )
        .run(totalCost, sessionId);

      // Add item to supplies or barter goods
      if (["food", "water", "medicine", "fuel", "tools"].includes(item)) {
        // Update supplies (handled by supplies API)
        res.json({ success: true, message: "Trade completed" });
      } else {
        // Add to barter goods
        const newBarterGoods = { ...currentBarterGoods };
        newBarterGoods[item] = (newBarterGoods[item] || 0) + quantity;

        sessionDb
          .prepare(
            `
          UPDATE session_economy 
          SET barter_goods = ?
          WHERE session_id = ?
        `
          )
          .run(JSON.stringify(newBarterGoods), sessionId);

        res.json({ success: true, message: "Trade completed" });
      }
    } else if (type === "sell") {
      // Update currency
      sessionDb
        .prepare(
          `
        UPDATE session_economy 
        SET currency_amount = currency_amount + ?
        WHERE session_id = ?
      `
        )
        .run(totalCost, sessionId);

      // Remove item from supplies or barter goods
      if (["food", "water", "medicine", "fuel", "tools"].includes(item)) {
        // Update supplies (handled by supplies API)
        res.json({ success: true, message: "Trade completed" });
      } else {
        // Remove from barter goods
        const newBarterGoods = { ...currentBarterGoods };
        newBarterGoods[item] = Math.max(
          0,
          (newBarterGoods[item] || 0) - quantity
        );

        sessionDb
          .prepare(
            `
          UPDATE session_economy 
          SET barter_goods = ?
          WHERE session_id = ?
        `
          )
          .run(JSON.stringify(newBarterGoods), sessionId);

        res.json({ success: true, message: "Trade completed" });
      }
    } else {
      throw new ValidationError("Invalid trade type");
    }
  })
);

// Phase 3: Weather API Endpoints
app.get(
  "/api/weather",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const WeatherManager = (await import("./game/weatherManager.js")).default;
    const weatherManager = new WeatherManager();

    const weather = weatherManager.getCurrentWeather(sessionDb, sessionId);

    res.json({ weather });
  })
);

app.post(
  "/api/weather/update",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const WeatherManager = (await import("./game/weatherManager.js")).default;
    const weatherManager = new WeatherManager();

    const weather = weatherManager.updateWeather(sessionDb, sessionId);

    res.json({ weather });
  })
);

// Phase 3: Minimap API Endpoints
app.get(
  "/api/minimap",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const discovered = sessionDb
      .prepare(
        `
        SELECT location_id, discovered_at
        FROM session_minimap 
        WHERE session_id = ? AND discovered = TRUE
      `
      )
      .all(sessionId);

    const discoveredLocations = discovered.map((row) => row.location_id);

    res.json({
      minimap: {
        discoveredLocations,
        currentLocation: "loreto", // TODO: Get from game state
      },
    });
  })
);

app.post(
  "/api/minimap/discover",
  asyncHandler(async (req, res) => {
    const { sessionId, locationId } = req.body;

    if (!sessionId || !locationId) {
      throw new ValidationError("sessionId and locationId are required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const currentTime = Math.floor(Date.now() / 1000);

    // Insert or update discovery
    sessionDb
      .prepare(
        `
        INSERT OR REPLACE INTO session_minimap 
        (session_id, location_id, discovered, discovered_at)
        VALUES (?, ?, TRUE, ?)
      `
      )
      .run(sessionId, locationId, currentTime);

    res.json({ success: true, message: "Location discovered" });
  })
);

// Phase 3: Camping API Endpoints
app.get(
  "/api/camping",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const camping = sessionDb
      .prepare(
        `
        SELECT camp_location, camp_setup_time, camp_safety_level, 
               camp_events, last_camp_time
        FROM session_camping 
        WHERE session_id = ?
      `
      )
      .get(sessionId);

    if (!camping) {
      // Return default camping state
      res.json({
        camping: {
          lastCampTime: null,
          campLocation: null,
          campSafetyLevel: 50,
          campEvents: [],
        },
      });
      return;
    }

    res.json({
      camping: {
        lastCampTime: camping.last_camp_time,
        campLocation: camping.camp_location,
        campSafetyLevel: camping.camp_safety_level,
        campEvents: JSON.parse(camping.camp_events || "[]"),
      },
    });
  })
);

app.post(
  "/api/camping/setup",
  asyncHandler(async (req, res) => {
    const { sessionId, locationId, safetyLevel } = req.body;

    if (!sessionId || !locationId) {
      throw new ValidationError("sessionId and locationId are required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const currentTime = Math.floor(Date.now() / 1000);

    // Update camping state
    sessionDb
      .prepare(
        `
        INSERT OR REPLACE INTO session_camping 
        (session_id, camp_location, camp_setup_time, camp_safety_level, last_camp_time)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .run(sessionId, locationId, currentTime, safetyLevel || 50, currentTime);

    res.json({ success: true, message: "Camp set up successfully" });
  })
);

app.post(
  "/api/camping/event",
  asyncHandler(async (req, res) => {
    const { sessionId, eventData } = req.body;

    if (!sessionId || !eventData) {
      throw new ValidationError("sessionId and eventData are required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    // Get current camp events
    const camping = sessionDb
      .prepare(
        `
        SELECT camp_events FROM session_camping WHERE session_id = ?
      `
      )
      .get(sessionId);

    const currentEvents = JSON.parse(camping?.camp_events || "[]");
    const newEvents = [...currentEvents, eventData];

    // Update camp events
    sessionDb
      .prepare(
        `
        UPDATE session_camping 
        SET camp_events = ?
        WHERE session_id = ?
      `
      )
      .run(JSON.stringify(newEvents), sessionId);

    res.json({ success: true, message: "Camp event recorded" });
  })
);

// Phase 4: Equipment API Endpoints
app.get(
  "/api/equipment",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const EquipmentManager = (await import("./game/equipmentManager.js"))
      .default;
    const equipmentManager = new EquipmentManager();

    const equipment = equipmentManager.getEquipment(sessionDb, sessionId);

    res.json({ equipment });
  })
);

app.post(
  "/api/equipment/add",
  asyncHandler(async (req, res) => {
    const { sessionId, itemId, acquiredFrom } = req.body;

    if (!sessionId || !itemId) {
      throw new ValidationError("sessionId and itemId are required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const EquipmentManager = (await import("./game/equipmentManager.js"))
      .default;
    const equipmentManager = new EquipmentManager();

    const equipment = equipmentManager.addEquipment(
      sessionDb,
      sessionId,
      itemId,
      acquiredFrom
    );

    res.json({ success: true, equipment });
  })
);

app.delete(
  "/api/equipment/:itemId",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.query;
    const { itemId } = req.params;

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const EquipmentManager = (await import("./game/equipmentManager.js"))
      .default;
    const equipmentManager = new EquipmentManager();

    const success = equipmentManager.removeEquipment(
      sessionDb,
      sessionId,
      itemId
    );

    res.json({ success });
  })
);

// Phase 4: Enhanced Travel API Endpoints
app.get(
  "/api/travel/options",
  asyncHandler(async (req, res) => {
    const { sessionId, currentLocation } = req.query;

    if (!sessionId || !currentLocation) {
      throw new ValidationError("sessionId and currentLocation are required");
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const TravelManager = (await import("./game/travelManager.js")).default;
    const travelManager = new TravelManager();

    // Get weather data
    const WeatherManager = (await import("./game/weatherManager.js")).default;
    const weatherManager = new WeatherManager();
    const weather = weatherManager.getCurrentWeather(sessionDb, sessionId);

    // Get party skills
    const party = sessionDb
      .prepare(
        `
        SELECT skills FROM session_party WHERE session_id = ?
      `
      )
      .all(sessionId);

    const partySkills = {};
    party.forEach((member) => {
      const skills = JSON.parse(member.skills || "[]");
      skills.forEach((skill) => {
        if (!partySkills[skill.type]) {
          partySkills[skill.type] = 0;
        }
        partySkills[skill.type] += skill.level;
      });
    });

    // Get equipment effects
    const EquipmentManager = (await import("./game/equipmentManager.js"))
      .default;
    const equipmentManager = new EquipmentManager();
    const equipmentEffects = equipmentManager.getEquipmentEffects(
      sessionDb,
      sessionId
    );

    const travelOptions = travelManager.getTravelOptions(
      currentLocation,
      weather,
      partySkills,
      equipmentEffects
    );

    res.json({ travelOptions });
  })
);

app.post(
  "/api/travel/calculate",
  asyncHandler(async (req, res) => {
    const { sessionId, fromLocation, toLocation } = req.body;

    if (!sessionId || !fromLocation || !toLocation) {
      throw new ValidationError(
        "sessionId, fromLocation, and toLocation are required"
      );
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const TravelManager = (await import("./game/travelManager.js")).default;
    const travelManager = new TravelManager();

    // Get weather data
    const WeatherManager = (await import("./game/weatherManager.js")).default;
    const weatherManager = new WeatherManager();
    const weather = weatherManager.getCurrentWeather(sessionDb, sessionId);

    // Get party skills
    const party = sessionDb
      .prepare(
        `
        SELECT skills FROM session_party WHERE session_id = ?
      `
      )
      .all(sessionId);

    const partySkills = {};
    party.forEach((member) => {
      const skills = JSON.parse(member.skills || "[]");
      skills.forEach((skill) => {
        if (!partySkills[skill.type]) {
          partySkills[skill.type] = 0;
        }
        partySkills[skill.type] += skill.level;
      });
    });

    // Get equipment effects
    const EquipmentManager = (await import("./game/equipmentManager.js"))
      .default;
    const equipmentManager = new EquipmentManager();
    const equipmentEffects = equipmentManager.getEquipmentEffects(
      sessionDb,
      sessionId
    );

    const modifiers = {
      weather,
      partySkills,
      equipment: equipmentEffects,
    };

    const travelInfo = travelManager.calculateTravelTime(
      fromLocation,
      toLocation,
      modifiers
    );

    res.json({ travelInfo });
  })
);

app.post(
  "/api/travel/execute",
  asyncHandler(async (req, res) => {
    const { sessionId, fromLocation, toLocation, retreatType } = req.body;

    if (!sessionId || !fromLocation || !toLocation) {
      throw new ValidationError(
        "sessionId, fromLocation, and toLocation are required"
      );
    }

    const sessionDb = getSessionDb(sessionId);
    if (!sessionDb) {
      throw new ValidationError("Session not found");
    }

    const TravelManager = (await import("./game/travelManager.js")).default;
    const travelManager = new TravelManager();

    // Get weather data
    const WeatherManager = (await import("./game/weatherManager.js")).default;
    const weatherManager = new WeatherManager();
    const weather = weatherManager.getCurrentWeather(sessionDb, sessionId);

    // Get party skills
    const party = sessionDb
      .prepare(
        `
        SELECT skills FROM session_party WHERE session_id = ?
      `
      )
      .all(sessionId);

    const partySkills = {};
    party.forEach((member) => {
      const skills = JSON.parse(member.skills || "[]");
      skills.forEach((skill) => {
        if (!partySkills[skill.type]) {
          partySkills[skill.type] = 0;
        }
        partySkills[skill.type] += skill.level;
      });
    });

    // Get equipment effects
    const EquipmentManager = (await import("./game/equipmentManager.js"))
      .default;
    const equipmentManager = new EquipmentManager();
    const equipmentEffects = equipmentManager.getEquipmentEffects(
      sessionDb,
      sessionId
    );

    const modifiers = {
      weather,
      partySkills,
      equipment: equipmentEffects,
    };

    let travelInfo;
    if (retreatType) {
      travelInfo = travelManager.calculateRetreat(
        fromLocation,
        toLocation,
        retreatType,
        modifiers
      );
    } else {
      travelInfo = travelManager.calculateTravelTime(
        fromLocation,
        toLocation,
        modifiers
      );
    }

    // Update travel state
    travelInfo.destination = toLocation;
    travelInfo.isRetreat = !!retreatType;
    travelManager.updateTravelState(sessionDb, sessionId, travelInfo);

    res.json({ success: true, travelInfo });
  })
);

// Content Generation API endpoints
app.get(
  "/api/content/characters",
  asyncHandler(async (req, res) => {
    const { biome, type, rarity } = req.query;
    const ContentGenerator = (await import("./game/contentGenerator.js"))
      .default;
    const contentGenerator = new ContentGenerator();

    // Get character templates from the generator
    const characters =
      contentGenerator.templates.characters[biome] ||
      contentGenerator.templates.characters.default;
    res.json({ characters });
  })
);

app.get(
  "/api/content/locations",
  asyncHandler(async (req, res) => {
    const { biome, type, rarity } = req.query;
    const ContentGenerator = (await import("./game/contentGenerator.js"))
      .default;
    const contentGenerator = new ContentGenerator();

    // Get location templates from the generator
    const locations =
      contentGenerator.templates.locations[biome] ||
      contentGenerator.templates.locations.default;
    res.json({ locations });
  })
);

app.get(
  "/api/content/animals",
  asyncHandler(async (req, res) => {
    const { biome, type, rarity } = req.query;
    const ContentGenerator = (await import("./game/contentGenerator.js"))
      .default;
    const contentGenerator = new ContentGenerator();

    // Get animal templates from the generator
    const animals =
      contentGenerator.templates.animals[biome] ||
      contentGenerator.templates.animals.default;
    res.json({ animals });
  })
);

app.get(
  "/api/content/items",
  asyncHandler(async (req, res) => {
    const { biome, type, rarity } = req.query;
    const ContentGenerator = (await import("./game/contentGenerator.js"))
      .default;
    const contentGenerator = new ContentGenerator();

    // Get item templates from the generator
    const items =
      contentGenerator.templates.items[biome] ||
      contentGenerator.templates.items.default;
    res.json({ items });
  })
);

app.post(
  "/api/content/generate",
  asyncHandler(async (req, res) => {
    const { type, biome, context } = req.body;
    if (!type || !biome) {
      throw new ValidationError("type and biome are required");
    }
    const ContentGenerator = (await import("./game/contentGenerator.js"))
      .default;
    const contentGenerator = new ContentGenerator();

    let generatedContent;
    switch (type) {
      case "character":
        generatedContent = contentGenerator.generateCharacter(
          biome,
          biome,
          context?.difficulty || 1,
          context
        );
        break;
      case "location":
        generatedContent = contentGenerator.generateLocation(
          biome,
          context?.position || {},
          context?.connections || [],
          context?.worldState || {}
        );
        break;
      case "animal":
        generatedContent = contentGenerator.generateAnimalEncounter(
          biome,
          context?.timeOfDay || "morning",
          context?.weather || { type: "normal" },
          context?.playerLevel || 1
        );
        break;
      case "item":
        generatedContent = contentGenerator.generateItem(
          biome,
          context?.rarity || "common",
          context
        );
        break;
      default:
        throw new ValidationError("Invalid content type");
    }

    res.json({ content: generatedContent });
  })
);

// Dynamic Storytelling API endpoints
app.post(
  "/api/story/record-choice",
  asyncHandler(async (req, res) => {
    const { sessionId, choiceId, choice, context } = req.body;
    if (!sessionId || !choiceId || !choice) {
      throw new ValidationError("sessionId, choiceId, and choice are required");
    }
    const StoryManager = (await import("./game/storyManager.js")).default;
    const storyManager = new StoryManager();
    const choiceRecord = storyManager.recordChoice(
      sessionId,
      choiceId,
      choice,
      context
    );
    res.json({ choiceRecord });
  })
);

app.get(
  "/api/story/choices/:sessionId",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const StoryManager = (await import("./game/storyManager.js")).default;
    const storyManager = new StoryManager();
    const choices = storyManager.getPlayerChoices(sessionId);
    res.json({ choices });
  })
);

app.get(
  "/api/story/world-state/:sessionId",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const StoryManager = (await import("./game/storyManager.js")).default;
    const storyManager = new StoryManager();
    const worldState = storyManager.getWorldState(sessionId);
    res.json({ worldState });
  })
);

app.get(
  "/api/story/narratives/:sessionId",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const StoryManager = (await import("./game/storyManager.js")).default;
    const storyManager = new StoryManager();
    const narratives = storyManager.getEmergentNarratives(sessionId);
    res.json({ narratives });
  })
);

app.post(
  "/api/story/generate-narrative",
  asyncHandler(async (req, res) => {
    const { sessionId, context } = req.body;
    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }
    const StoryManager = (await import("./game/storyManager.js")).default;
    const storyManager = new StoryManager();
    const narrative = storyManager.generateEmergentNarrative(
      sessionId,
      context
    );
    res.json({ narrative });
  })
);

app.post(
  "/api/story/apply-consequences",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }
    const StoryManager = (await import("./game/storyManager.js")).default;
    const storyManager = new StoryManager();
    const appliedConsequences =
      storyManager.applyScheduledConsequences(sessionId);
    res.json({ appliedConsequences });
  })
);

// Optional: Serve built web app from apps/web/dist
const distPath = path.join(__dirname, "../../web/dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/start") ||
      req.path.startsWith("/turn") ||
      req.path.startsWith("/healthz")
    ) {
      return next();
    }

    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.status(404).send("Frontend build not found");
  });
}

// Add validation error handler middleware (must be after routes)
app.use(validationErrorHandler);

// General error handler
app.use((err, req, res, next) => {
  console.error("[Server Error]", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server with async initialization
async function startServer() {
  // Initialize MCP tools
  mcpTools = await registerAllTools(db);
  console.log(
    "✅ MCP tools registered:",
    mcpTools.listTools().length,
    "tools available"
  );

  // Make MCP tools available to all endpoints
  app.locals.mcpTools = mcpTools;

  // Reinitialize dialogue narrator with MCP tools
  dialogueNarrator = new DialogueNarrator({ mcpTools });
  console.log("✅ DialogueNarrator initialized with MCP tools");

  // Start session cleanup (runs every hour)
  startSessionCleanup();
  console.log("✅ Session cleanup scheduler started");

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌊 Igapó server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🎮 Hybrid Interaction System enabled`);
    console.log(`💾 Session-based character system active`);
  });
}

startServer().catch(console.error);
