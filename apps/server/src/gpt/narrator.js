import { config } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

config();

const DEFAULT_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929";

const baseSystemPrompt = `You are the narrator for a text-based Amazon River expedition. Stay grounded in the provided game state.
Keep responses under 100 words - be concise and atmospheric. Use vivid sensory language. Avoid inventing game mechanics—only reference data you are given.
DO NOT list the player's options in your narrative - they will be shown separately.
Vary your descriptions based on previous events to keep the experience fresh.`;

const buildActionContext = ({ stateSummary, encounter, action }) => {
  const locationLine = `${stateSummary.location} — ${stateSummary.biome}`;
  const vitalsLine = `Morale ${stateSummary.morale}/100 · Stamina ${stateSummary.stamina}/100 · Supplies ${stateSummary.supplies}`;
  const statusLine = `Status: ${stateSummary.status}`; // TODO: Add days when camping is implemented
  const encounterLine = encounter
    ? `${encounter.title}: ${encounter.narrative}`
    : "No special encounter on this segment.";
  const actionLine = action
    ? `Player action: ${action.label} — ${action.description}`
    : "Player is beginning the journey.";

  return [locationLine, vitalsLine, statusLine, actionLine, encounterLine].join(
    "\n"
  );
};

export class Narrator {
  constructor(options = {}) {
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is required in the environment to run the narrator."
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = options.model || DEFAULT_MODEL;
  }

  async intro(statePayload) {
    const { state } = statePayload;

    const location = state.route[state.progress] || state.route[0];

    const storySystemPrompt = `You are the narrator for an educational Amazon River expedition adventure. The story has depth:

MISSION: ${state.playerName} is a botanist searching for the legendary "Lágrimas da Lua" (Tears of the Moon) - a rare flower that blooms once every 50 years deep in the Amazon. Indigenous legends say it can cure any disease. Your grandmother is dying, and this is her only hope.

EDUCATIONAL GOALS: Weave in real facts about:
- Amazon biodiversity (40,000+ plant species, 1,300 bird species, 3,000 fish species)
- Indigenous cultures and their deep knowledge
- Ecological challenges (deforestation, climate change)
- River ecosystems and their importance

Keep the intro under 120 words. Set the tone: urgent mission, personal stakes, wonder of the Amazon, educational.`;

    const userPrompt = `Player: ${state.playerName}
Starting location: ${location.name} (${location.biome})
Description: ${location.description}

Write the opening that establishes:
1. Why ${state.playerName} is here (finding Lágrimas da Lua to save their grandmother)
2. The challenge ahead (journey through the Amazon's heart)
3. One educational fact about this location
4. The emotional weight of the mission

Be vivid, concise, and set the stakes high.`;

    const completion = await this.client.messages.create({
      model: this.model,
      max_tokens: 250,
      system: storySystemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const text = completion.content[0]?.text ?? "";

    // Split text into paragraphs for the frontend
    const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);

    // Return a Narrative object
    return {
      summary: paragraphs[0] || text.substring(0, 100),
      paragraphs,
      mood: "neutral",
    };
  }

  async narrateTurn(context) {
    const { stateSummary, encounter, action } = context;

    const prompt = `${buildActionContext({ stateSummary, encounter, action })}

Describe what happens next in 2-3 vivid sentences. Focus on the encounter and its immediate effects. Be concise and atmospheric. Don't list options.`;

    const completion = await this.client.messages.create({
      model: this.model,
      max_tokens: 200,
      system: baseSystemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = completion.content[0]?.text ?? "";

    // Split text into paragraphs for the frontend
    const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);

    // Return a Narrative object
    return {
      summary: paragraphs[0] || text.substring(0, 100),
      paragraphs,
      mood: "neutral",
    };
  }

  async generateDynamicTurn(state, mcpTools = null) {
    const location = state.route[state.progress] ?? state.route.at(-1);
    const recentJournal = state.journal
      .slice(-3)
      .map((entry) =>
        entry.kind === "encounter" ? entry.encounter.title : entry.kind
      )
      .join(", ");

    // Fetch authentic Amazon data from database if MCP tools available
    let locationData = null;
    let animalsData = [];
    let plantsData = [];

    if (mcpTools) {
      try {
        // Get random location details for context
        const locationResult = await mcpTools.call(
          "amazon_db.get_random_location",
          {}
        );
        if (locationResult?.content?.[0]?.text) {
          locationData = JSON.parse(locationResult.content[0].text);
        }

        // Get 2-3 random animals for potential encounters
        const animalsResult = await mcpTools.call(
          "amazon_db.get_random_animals",
          { count: 3 }
        );
        if (animalsResult?.content?.[0]?.text) {
          animalsData = JSON.parse(animalsResult.content[0].text);
        }

        // Get 1-2 plants for medicinal/foraging encounters
        const plantsResult = await mcpTools.call(
          "amazon_db.get_random_plants",
          { count: 2, medicinal: true }
        );
        if (plantsResult?.content?.[0]?.text) {
          plantsData = JSON.parse(plantsResult.content[0].text);
        }
      } catch (error) {
        console.error("Failed to fetch database content:", error);
        // Continue without database data if it fails
      }
    }

    const systemPrompt = `You are the game master for an educational Amazon River adventure set in the 1930s. ${state.playerName} is searching for "Lágrimas da Lua" (Tears of the Moon), a legendary healing flower to save their dying grandmother. This mission drives the story but should feel natural and organic - not tracked numerically.

STORY STRUCTURE:
- Early journey: Learning about the Amazon, meeting locals, building knowledge
- Mid journey: Challenges increase, clues about the flower emerge through indigenous wisdom and discoveries
- Late journey: Racing against time as grandmother's condition worsens, urgency builds
- Encounters naturally reference the quest and build toward discovery
- The player's progress is felt through narrative, not numbers

EDUCATIONAL REQUIREMENTS - Each encounter must include ONE real fact about:
- Amazon biodiversity (419+ mammal species, 1,300+ birds, 427+ amphibians, 3,000+ fish)
- Indigenous knowledge (250+ indigenous groups, medicinal plant expertise, sustainable practices)
- Ecology (Amazon produces 20% of Earth's oxygen, 209,000 sq km lost to deforestation)
- River system (Amazon River is 6,400km long, 1,100+ tributaries, carries 20% of world's river water)
- Wildlife behavior (pink river dolphins use echolocation, jaguars are excellent swimmers, harpy eagles hunt monkeys)
- Plants (80,000+ plant species, many with medicinal properties, complex symbiotic relationships)

ENCOUNTER VARIETY:
- Wildlife: jaguars, anacondas, piranhas, pink dolphins, sloths, harpy eagles, poison dart frogs, caimans, capybaras
- Indigenous groups: Share knowledge, warn of dangers, offer traditional medicine, tell legends
- Nature events: storms, rapids, bioluminescence, flooded forests (várzea), terra firme forests
- Discoveries: medicinal plants, ancient petroglyphs, hidden waterfalls, rare species
- Challenges: illegal loggers, disease, equipment failure, moral dilemmas

RULES:
1. Narrative: 2-3 SHORT sentences with ONE educational fact woven naturally
2. Generate exactly 3 meaningful, distinct choices
3. Choices reflect mission (finding flower, helping locals, learning, surviving)
4. Consequences: significant (±5 to ±15 stats), rewards HIDDEN from player
5. Progress deltas: RARE! Only +1 for significant forward movement (paddling hard, shortcuts). Most = 0. Never more than ONE +1 per turn.
6. Morally interesting choices (help vs. hurry, learn vs. rush, risk vs. safety)
7. Reference grandmother occasionally (days 5, 10, 15+) but subtly
8. Rewards vary: stats, items (medicinal plants, tools), crew (guides), or events
9. **KEEP DESCRIPTIONS SHORT** - label ≤ 5 words, description ≤ 15 words, reward narratives ≤ 12 words
10. NO MARKDOWN, NO CODE BLOCKS - Return ONLY valid JSON

JSON Format (ALWAYS include animalName and scientificName when featuring wildlife):
{
  "narrative": "Story with educational fact naturally integrated",
  "educationalNote": "Quick factoid for player (optional, shows in small text)",
  "animalName": "Jaguar",
  "scientificName": "Panthera onca",
  "choices": [
    {
      "id": "unique_id",
      "label": "Action verb phrase",
      "description": "What this choice means (focus on story/roleplay, not stats)",
      "deltas": {"morale": -15 to +15, "stamina": -15 to +15, "supplies": -15 to +15, "progress": -1 to +1},
      "reward": {
        "type": "stat|item|crew|event|knowledge",
        "value": "description of what is gained (item name, crew member, knowledge learned, etc.)",
        "narrative": "Brief description of reward revealed AFTER choice (optional)"
      }
    }
  ]
}`;

    // TODO: Story phase will be determined by progress/events instead of days
    // Determine story phase based on progress for now
    let storyPhase = "early";
    let urgency = "";
    if (state.progress >= 70) {
      storyPhase = "late";
      urgency = "Grandmother is critical. Time is running out!";
    } else if (state.progress >= 40) {
      storyPhase = "mid";
      urgency = "Word arrives: grandmother is weakening.";
    } else if (state.progress >= 20) {
      storyPhase = "early-mid";
      urgency = "The mission weighs heavy. You must hurry.";
    }

    // Build database context for Claude
    let databaseContext = "";
    if (locationData) {
      databaseContext += `\n\nAUTHENTIC LOCATION DATA (use for historical accuracy):
- Name: ${locationData.name} (Founded: ${locationData.year_founded})
- Type: ${locationData.location_type}, Biome: ${locationData.biome}
- Indigenous tribes: ${locationData.indigenous_tribes}
- Historical note: ${locationData.historical_note}
- Notable features: ${locationData.notable_features}`;
    }

    if (animalsData.length > 0) {
      databaseContext += `\n\nAVAILABLE WILDLIFE (select ONE to feature):`;
      animalsData.forEach((animal) => {
        databaseContext += `\n- ${animal.common_name} (${animal.scientific_name}, Indigenous: ${animal.indigenous_name})
  Category: ${animal.category}, Danger: ${animal.danger_level}
  Behavior: ${animal.behavior}
  Fact: ${animal.interesting_fact}`;
      });
    }

    if (plantsData.length > 0) {
      databaseContext += `\n\nMEDICINAL PLANTS (for healing/foraging encounters):`;
      plantsData.forEach((plant) => {
        databaseContext += `\n- ${plant.common_name} (${plant.scientific_name})
  Indigenous use: ${plant.medicinal_use}
  Modern relevance: ${plant.modern_applications || "Traditional use only"}`;
      });
    }

    // Build context about what player has collected/learned
    let playerContext = "";
    if (state.inventory && state.inventory.length > 0) {
      playerContext += `\n- Items collected: ${state.inventory.join(", ")}`;
    }
    if (state.crew && state.crew.length > 0) {
      playerContext += `\n- Crew members: ${state.crew.join(", ")}`;
    }
    if (state.knowledge && state.knowledge.length > 0) {
      playerContext += `\n- Knowledge gained: ${state.knowledge.join(", ")}`;
    }

    const userPrompt = `Current State:
- Location: ${location.name} (${location.biome})
- Description: ${location.description}
- Progress: ${state.progress}/${
      state.route.length - 1
    } locations (${storyPhase} phase)
- Morale: ${state.morale}/100, Stamina: ${state.stamina}/100, Supplies: ${
      state.supplies
    }
- Recent events: ${recentJournal || "none yet"}
- Last action: ${state.lastAction?.label || "journey beginning"}${playerContext}
${urgency ? `- URGENCY: ${urgency}` : ""}${databaseContext}

Generate an encounter that:
1. Fits the ${storyPhase} story phase
2. ${
      locationData || animalsData.length > 0 || plantsData.length > 0
        ? "Uses the AUTHENTIC DATA above (animals, plants, or location facts) - reference scientific names, indigenous knowledge, and real behaviors"
        : "Includes ONE educational fact about the Amazon (naturally woven in, not forced)"
    }
3. References the mission to find Lágrimas da Lua ${
      storyPhase === "late"
        ? "(maybe a clue or lead!)"
        : storyPhase === "mid"
        ? "(perhaps indigenous knowledge helps)"
        : "(subtly)"
    }
4. Offers 3 meaningful choices with clear moral/strategic trade-offs
5. Is completely different from: ${recentJournal || "none"}
6. **CRITICAL**: Create UNIQUE encounters each turn! Consider: 
   - Has player met indigenous people yet? (Check crew/knowledge)
   - Has player collected medicinal plants? (Check inventory)
   - Time of day varies (dawn, noon, dusk, night) - mention it!
   - Weather changes (rain, fog, heat, storms)
   - River conditions shift (calm, rapids, flooded forest)

**CRITICAL FOR ANIMAL ENCOUNTERS**: 
- If you feature ANY animal from the list above, you MUST include these exact fields in JSON:
  - "animalName": "<copy exact common_name from database>"
  - "scientificName": "<copy exact scientific_name from database>"
- Example: "animalName": "Pink River Dolphin", "scientificName": "Inia geoffrensis"

${
  locationData || animalsData.length > 0
    ? "IMPORTANT: Use the real animal/location data provided above to make this educational and authentic. Reference indigenous names, scientific facts, and historical context. When featuring an animal, copy its common_name and scientific_name EXACTLY to animalName and scientificName fields."
    : "Be creative, educational, and emotionally engaging!"
}`;

    const completion = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const responseText = completion.content[0]?.text ?? "{}";

    try {
      // Clean up any markdown code blocks
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText
          .replace(/```json?\n?/g, "")
          .replace(/```\n?$/g, "");
      }

      const result = JSON.parse(cleanedText);

      // Validate structure
      if (
        !result.narrative ||
        !Array.isArray(result.choices) ||
        result.choices.length === 0
      ) {
        throw new Error("Invalid response structure");
      }

      return result;
    } catch (error) {
      console.error("Failed to parse Claude response:", responseText, error);
      // Fallback to a safe default
      return {
        narrative:
          "The river flows steadily ahead. Your crew awaits your decision.",
        choices: [
          {
            id: "paddle",
            label: "Continue paddling",
            description: "Push forward down the river",
            deltas: { progress: 1, stamina: -5, supplies: -3 },
          },
          {
            id: "rest",
            label: "Rest briefly",
            description: "Take a moment to recover",
            deltas: { stamina: 5, morale: 3, supplies: -2 },
          },
          {
            id: "forage",
            label: "Look for supplies",
            description: "Search the riverbank",
            deltas: { supplies: 8, stamina: -4 },
          },
        ],
      };
    }
  }
}
