import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import {
  createInitialState,
  applyAction,
  getAvailableActions,
} from "./game/stateManager.js";
import { Narrator } from "./gpt/narrator.js";
import { initializeDatabase } from "./database/initDatabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = initializeDatabase();
console.log("✅ Database initialized with Amazon data");

const JOURNEY_LOCATIONS = [
  {
    name: "Manaus Docks",
    biome: "confluence",
    description:
      "Steam rises where the Rio Negro meets the Solimões, painting a line of bronze across the water.",
    fact:
      "The Meeting of Waters flows side by side for nearly 6 kilometers before mixing.",
    outcome: "calm",
  },
  {
    name: "Anavilhanas Archipelago",
    biome: "rainforest",
    description:
      "A maze of 400 emerald islands scatters moonlight into silver trails.",
    fact:
      "Anavilhanas is one of the world's largest freshwater archipelagos, home to pink river dolphins.",
    outcome: "mystery",
  },
  {
    name: "Tapajós Tributary",
    biome: "white-sand forest",
    description:
      "Quiet sandbars glow ivory while forest cicadas pulse like a heartbeat in the canopy.",
    fact:
      "Tapajós waters run clear thanks to ancient sandstone filtering the flow for millennia.",
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
  const supplies = Math.max(0, 55 + Math.round(rng() * 8) + appliedDeltas.supplies);

  const journalEntries = previousJournal ? [...previousJournal] : [];
  if (choiceId) {
    journalEntries.push({
      id: `journal-${day}`,
      day,
      text: `Day ${day}: Chose ${choiceId.replace(/-/g, " ")}. ${location.description}`,
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
      ? JOURNEY_CHOICES.find((choice) => choice.id === choiceId)?.mood ?? location.outcome
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
        ? `Your decision to ${choiceId.replace(/-/g, " ")} reveals new currents threading toward the legendary Lágrimas da Lua.`
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

// Create simple MCP-like tools interface for narrator
const mcpTools = {
  async call(toolName, params) {
    try {
      switch (toolName) {
        case "amazon_db.get_random_location": {
          const location = db
            .prepare("SELECT * FROM locations ORDER BY RANDOM() LIMIT 1")
            .get();
          return {
            content: [
              { type: "text", text: JSON.stringify(location, null, 2) },
            ],
          };
        }

        case "amazon_db.get_random_animals": {
          const { count = 3, category, dangerLevel } = params;
          let query = "SELECT * FROM animals WHERE 1=1";
          const queryParams = [];

          if (category) {
            query += " AND category = ?";
            queryParams.push(category);
          }

          if (dangerLevel) {
            query += " AND danger_level = ?";
            queryParams.push(dangerLevel);
          }

          query += " ORDER BY RANDOM() LIMIT ?";
          queryParams.push(count);

          const animals = db.prepare(query).all(...queryParams);
          return {
            content: [{ type: "text", text: JSON.stringify(animals, null, 2) }],
          };
        }

        case "amazon_db.get_random_plants": {
          const { count = 2, medicinal } = params;
          let query = "SELECT * FROM plants";
          const queryParams = [];

          if (medicinal !== undefined) {
            query += " WHERE medicinal_use IS NOT NULL";
          }

          query += " ORDER BY RANDOM() LIMIT ?";
          queryParams.push(count);

          const plants = db.prepare(query).all(...queryParams);
          return {
            content: [{ type: "text", text: JSON.stringify(plants, null, 2) }],
          };
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`MCP tool error (${toolName}):`, error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
};

// Middleware
app.use(cors());
app.use(express.json());

// Initialize narrator
const narrator = new Narrator();

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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start a new game
app.post("/api/start", async (req, res) => {
  try {
    const { playerName } = req.body;
    if (!playerName) {
      return res.status(400).json({ error: "Player name is required" });
    }

    const state = createInitialState(playerName);
    res.json({ state });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get available actions for current state
app.post("/api/actions", async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: "State is required" });
    }

    const actions = getAvailableActions(state);
    res.json({ actions });
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

    // Build context for narration
    const context = {
      stateSummary: {
        location: result.state.location,
        biome: result.state.biome,
        morale: result.state.morale,
        stamina: result.state.stamina,
        supplies: result.state.supplies,
        daysElapsed: result.state.daysElapsed,
        status: result.state.status,
      },
      encounter: result.encounter,
      action: result.action,
    };

    res.json({
      state: result.state,
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
    nextState.daysElapsed += 1;
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
      nextState.progress >= nextState.route.length - 1 &&
      nextState.daysElapsed >= 10
    ) {
      // Must reach final location AND have journeyed for at least 10 days
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

const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/start") ||
      req.path.startsWith("/turn")
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

// Start server
app.listen(PORT, () => {
  console.log(`🌊 Amazon Trail server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
