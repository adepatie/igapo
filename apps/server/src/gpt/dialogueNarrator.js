import { config } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load fallback dialogue configuration
const fallbackDialogue = JSON.parse(
  readFileSync(join(__dirname, "../config/fallbackDialogue.json"), "utf-8")
);

const DEFAULT_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929";

export class DialogueNarrator {
  constructor(options = {}) {
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is required in the environment to run the narrator."
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = options.model || DEFAULT_MODEL;
    this.mcpTools = options.mcpTools || null;
  }

  /**
   * Generate initial dialogue when meeting a character
   * @param {Object} options - Dialogue generation options
   * @param {Object} options.character - Character data
   * @param {Object} options.state - Game state
   * @param {string} options.location - Current location
   * @param {string} options.playerId - Player identifier
   * @param {Database} options.sessionDb - Session database for relationships
   */
  async generateIntroDialogue({
    character,
    state,
    location,
    playerId,
    sessionDb,
  }) {
    // Get enriched context from MCP if available
    let mcpContext = null;
    if (this.mcpTools) {
      try {
        const result = await this.mcpTools.call(
          "character.get_dialogue_context",
          {
            characterId: character.id,
            playerId: playerId || state.playerName,
            location: location || state.location,
            gameDay: state.progress || 1,
          },
          sessionDb // Pass session DB to MCP tool
        );

        // Parse the MCP response
        if (result.content && result.content[0]?.text) {
          mcpContext = JSON.parse(result.content[0].text);
          console.log(`[MCP] Got context for ${character.name}:`, {
            isFirstMeeting: mcpContext.relationship?.is_first_meeting,
            relationshipLevel: mcpContext.relationship?.level,
            trustLevel: mcpContext.relationship?.trust,
            availableKnowledge: mcpContext.available_knowledge?.length || 0,
            knownRumors: mcpContext.known_rumors?.length || 0,
          });
        }
      } catch (error) {
        console.error("[MCP] Error getting character context:", error);
        // Continue without MCP context
      }
    }

    // Build enhanced system prompt with MCP context
    let contextualInfo = "";

    if (mcpContext) {
      const rel = mcpContext.relationship;

      if (rel.is_first_meeting) {
        contextualInfo +=
          "\n\nFIRST MEETING: This is the first time the character meets the player. Be welcoming but cautious.";
      } else {
        contextualInfo += `\n\nPREVIOUS RELATIONSHIP:
- You've met ${rel.total_interactions} times before
- Relationship level: ${rel.level}/10 (${
          rel.level > 5 ? "friendly" : rel.level > 0 ? "neutral" : "unfriendly"
        })
- Trust level: ${rel.trust}/100
- First met at: ${rel.first_met.location}`;

        if (rel.reputation_tags && rel.reputation_tags.length > 0) {
          contextualInfo += `\n- Player reputation: ${rel.reputation_tags.join(
            ", "
          )}`;
        }

        if (
          mcpContext.conversation_history &&
          mcpContext.conversation_history.length > 0
        ) {
          contextualInfo +=
            "\n\nPREVIOUS CONVERSATIONS (reference these naturally):";
          mcpContext.conversation_history.slice(0, 2).forEach((conv, i) => {
            contextualInfo += `\n- Last conversation: Player said "${
              conv.player_choice
            }", you responded about ${
              conv.topics?.join(", ") || "general matters"
            }`;
          });
        }
      }

      // Add available knowledge/secrets
      if (
        mcpContext.available_knowledge &&
        mcpContext.available_knowledge.length > 0
      ) {
        contextualInfo +=
          "\n\nSECRETS YOU CAN SHARE (if trust is high enough):";
        mcpContext.available_knowledge.slice(0, 3).forEach((knowledge) => {
          contextualInfo += `\n- ${knowledge.type} (importance: ${
            knowledge.importance
          }/10): ${JSON.stringify(knowledge.data).substring(0, 100)}`;
        });
      }

      // Add rumors
      if (mcpContext.known_rumors && mcpContext.known_rumors.length > 0) {
        contextualInfo += "\n\nRUMORS YOU KNOW:";
        mcpContext.known_rumors.slice(0, 2).forEach((rumor) => {
          contextualInfo += `\n- ${rumor.text} (${Math.round(
            rumor.accuracy * 100
          )}% accurate)`;
        });
      }
    }

    const systemPrompt = `You are generating dialogue for an interactive Amazon River expedition game set in the 1930s.

CHARACTER PROFILE:
Name: ${character.name}
Role: ${character.role}
Archetype: ${character.archetype}
Background: ${character.backstory_template}
Knowledge Areas: ${character.typical_knowledge}${contextualInfo}

CONTEXT:
Location: ${location || state.location}
Player: ${state.playerName}
Player Status: Morale ${state.morale}/100, Stamina ${
      state.stamina
    }/100, Supplies ${state.supplies}

MISSION: The player is searching for the legendary "Lágrimas da Lua" (Tears of the Moon) flower to save their dying grandmother.

INSTRUCTIONS:
1. Write dialogue that fits the character's personality and knowledge
2. The character should react to the player's current status (low supplies = concern, etc.)
3. Reference the location and context naturally
4. Keep dialogue under 120 words, conversational and period-appropriate
5. Choose a mood that fits the situation: neutral, happy, worried, angry, excited, sad, suspicious, or thoughtful
6. Provide 3 player response options that feel natural and meaningful
7. Each option should have a different tone/approach

Return ONLY valid JSON in this exact format:
{
  "dialogue": {
    "text": "character dialogue here",
    "mood": "happy",
    "characterAction": "leans against the boat railing"
  },
  "options": [
    {
      "id": "option1",
      "text": "response text",
      "tone": "friendly"
    },
    {
      "id": "option2", 
      "text": "response text",
      "tone": "direct"
    },
    {
      "id": "option3",
      "text": "response text", 
      "tone": "cautious"
    }
  ]
}`;

    const userPrompt = `Generate the opening dialogue for ${
      character.name
    } meeting ${state.playerName} at ${location || state.location}.`;

    try {
      const completion = await this.client.messages.create({
        model: this.model,
        max_tokens: 600,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      const responseText = completion.content[0]?.text ?? "{}";

      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate the response has required fields
      if (!parsed.dialogue || !parsed.options) {
        throw new Error("Invalid dialogue response structure");
      }

      // Record this conversation turn in MCP if available
      if (this.mcpTools && mcpContext) {
        try {
          const sessionId = `session_${playerId || state.playerName}_${
            character.id
          }_${Date.now()}`;
          await this.mcpTools.call(
            "character.record_conversation",
            {
              playerId: playerId || state.playerName,
              characterId: character.id,
              sessionId: sessionId,
              turnNumber: 1,
              playerChoiceId: "intro",
              playerChoiceText: "Started conversation",
              playerChoiceTone: "neutral",
              characterResponse: parsed.dialogue.text,
              characterMood: parsed.dialogue.mood,
              topicsDiscussed: ["introduction", "mission"],
              location: location || state.location,
              gameDay: state.progress || 1,
            },
            sessionDb
          );
          console.log(
            `[MCP] Recorded intro conversation for ${character.name}`
          );
        } catch (error) {
          console.error("[MCP] Error recording conversation:", error);
        }
      }

      return parsed;
    } catch (error) {
      console.error("Error generating dialogue:", error);
      // Fallback dialogue if AI fails
      return this.getFallbackIntro(character, state);
    }
  }

  /**
   * Get fallback intro dialogue from config
   */
  getFallbackIntro(character, state) {
    const roleKey = character.role?.toLowerCase() || "default";
    const template =
      fallbackDialogue.intro[roleKey] || fallbackDialogue.intro.default;

    return {
      dialogue: {
        text: template.text
          .replace(/{name}/g, character.name)
          .replace(/{playerName}/g, state.playerName),
        mood: template.mood,
        characterAction: template.action,
      },
      options: fallbackDialogue.options.friendly
        .concat(fallbackDialogue.options.direct)
        .slice(0, 3),
    };
  }

  /**
   * Generate follow-up dialogue based on player's choice
   * @param {Object} options - Dialogue generation options
   * @param {Object} options.character - Character data
   * @param {Object} options.state - Game state
   * @param {Object} options.selectedOption - Player's selected option
   * @param {string} options.previousDialogue - Previous dialogue text
   * @param {string} options.playerId - Player identifier
   * @param {number} options.turnNumber - Turn number in conversation
   * @param {Database} options.sessionDb - Session database for relationships
   */
  async generateFollowUpDialogue({
    character,
    state,
    selectedOption,
    previousDialogue,
    playerId,
    turnNumber = 2,
    sessionDb,
  }) {
    // Get current relationship context from MCP
    let mcpContext = null;
    if (this.mcpTools) {
      try {
        const result = await this.mcpTools.call(
          "character.get_dialogue_context",
          {
            characterId: character.id,
            playerId: playerId || state.playerName,
            location: state.location,
            gameDay: state.progress || 1,
          },
          sessionDb // Pass session DB to MCP tool
        );

        if (result.content && result.content[0]?.text) {
          mcpContext = JSON.parse(result.content[0].text);
        }
      } catch (error) {
        console.error("[MCP] Error getting follow-up context:", error);
      }
    }

    // Determine relationship impact based on player's tone
    let relationshipDelta = 0;
    let trustDelta = 0;
    let reputationTag = null;

    switch (selectedOption.tone?.toLowerCase()) {
      case "friendly":
      case "respectful":
      case "curious":
        relationshipDelta = 1;
        trustDelta = 5;
        reputationTag = "friendly";
        break;
      case "direct":
      case "honest":
        trustDelta = 3;
        reputationTag = "straightforward";
        break;
      case "cautious":
      case "suspicious":
        trustDelta = -2;
        break;
      case "rude":
      case "dismissive":
        relationshipDelta = -1;
        trustDelta = -5;
        break;
    }

    // Build enhanced context
    let contextualInfo = "";
    if (mcpContext && mcpContext.relationship) {
      const rel = mcpContext.relationship;
      contextualInfo = `

RELATIONSHIP STATUS:
- Current relationship: ${rel.level}/10 (${
        rel.level > 5 ? "friendly" : rel.level > 0 ? "neutral" : "unfriendly"
      })
- Trust level: ${rel.trust}/100
- Interactions: ${rel.total_interactions}
- Player tone impact: ${selectedOption.tone} will ${
        relationshipDelta > 0
          ? "improve"
          : relationshipDelta < 0
          ? "harm"
          : "maintain"
      } relationship`;

      if (rel.reputation_tags && rel.reputation_tags.length > 0) {
        contextualInfo += `\n- You know player is: ${rel.reputation_tags.join(
          ", "
        )}`;
      }
    }

    const systemPrompt = `You are continuing a conversation in an Amazon River expedition game.

CHARACTER: ${character.name} (${character.archetype} ${character.role})
BACKGROUND: ${character.backstory_template}${contextualInfo}

PREVIOUS EXCHANGE:
${character.name}: "${previousDialogue}"
Player chose: "${selectedOption.text}" (${selectedOption.tone} tone)

CONTEXT:
Player: ${state.playerName}
Status: Morale ${state.morale}/100, Stamina ${state.stamina}/100, Supplies ${
      state.supplies
    }

Continue the conversation naturally. The character should:
- React to the player's choice and tone (${selectedOption.tone} tone suggests ${
      relationshipDelta >= 0 ? "positive" : "negative"
    } interaction)
- Share information based on their knowledge areas: ${
      character.typical_knowledge
    }
- Potentially offer help, trade, or guidance
- Keep response under 120 words
- Consider ending conversation naturally after 3-4 exchanges

Provide 2-3 new response options that progress the conversation or allow the player to end it.

Return ONLY valid JSON in this format:
{
  "dialogue": {
    "text": "character response",
    "mood": "happy",
    "characterAction": "gestures toward the river"
  },
  "options": [
    {
      "id": "continue",
      "text": "response option",
      "tone": "interested"
    },
    {
      "id": "end",
      "text": "Thank you, I should get going.",
      "tone": "polite"
    }
  ],
  "conversationEnds": false
}`;

    try {
      const completion = await this.client.messages.create({
        model: this.model,
        max_tokens: 600,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: "Continue the dialogue based on the player's choice.",
          },
        ],
      });

      const responseText = completion.content[0]?.text ?? "{}";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Update relationship and record conversation in MCP
      if (this.mcpTools && mcpContext) {
        try {
          // Update relationship based on interaction
          if (relationshipDelta !== 0 || trustDelta !== 0 || reputationTag) {
            await this.mcpTools.call(
              "character.update_relationship",
              {
                playerId: playerId || state.playerName,
                characterId: character.id,
                relationshipDelta: relationshipDelta,
                trustDelta: trustDelta,
                addReputationTag: reputationTag,
                gameDay: state.progress || 1,
              },
              sessionDb
            );
            console.log(
              `[MCP] Updated relationship: ${
                relationshipDelta >= 0 ? "+" : ""
              }${relationshipDelta} relationship, ${
                trustDelta >= 0 ? "+" : ""
              }${trustDelta} trust`
            );
          }

          // Record this conversation turn
          const sessionId = `session_${playerId || state.playerName}_${
            character.id
          }_${Date.now()}`;
          await this.mcpTools.call(
            "character.record_conversation",
            {
              playerId: playerId || state.playerName,
              characterId: character.id,
              sessionId: sessionId,
              turnNumber: turnNumber,
              playerChoiceId: selectedOption.id,
              playerChoiceText: selectedOption.text,
              playerChoiceTone: selectedOption.tone,
              characterResponse: parsed.dialogue.text,
              characterMood: parsed.dialogue.mood,
              moodChangeReason: `Reacted to ${selectedOption.tone} tone`,
              topicsDiscussed: this.extractTopics(parsed.dialogue.text),
              relationshipDelta: relationshipDelta,
              location: state.location,
              gameDay: state.progress || 1,
            },
            sessionDb
          );
          console.log(
            `[MCP] Recorded turn ${turnNumber} for ${character.name}`
          );
        } catch (error) {
          console.error("[MCP] Error updating relationship/recording:", error);
        }
      }

      return parsed;
    } catch (error) {
      console.error("Error generating follow-up dialogue:", error);
      return this.getFallbackFollowUp(character, state);
    }
  }

  /**
   * Extract topics from dialogue text
   */
  extractTopics(text) {
    const topics = [];
    const keywords = {
      flower: "Lágrimas da Lua",
      grandmother: "family",
      river: "navigation",
      jungle: "wilderness",
      danger: "threats",
      supplies: "resources",
      trade: "commerce",
      spirits: "mysticism",
      legend: "lore",
    };

    const lowerText = text.toLowerCase();
    for (const [keyword, topic] of Object.entries(keywords)) {
      if (lowerText.includes(keyword) && !topics.includes(topic)) {
        topics.push(topic);
      }
    }

    return topics.length > 0 ? topics : ["general"];
  }

  /**
   * Get fallback follow-up dialogue from config
   */
  getFallbackFollowUp(character, state) {
    const template = fallbackDialogue.followUp.farewell;

    return {
      dialogue: {
        text: template.text.replace(/{name}/g, character.name),
        mood: template.mood,
        characterAction: template.action,
      },
      options: fallbackDialogue.options.polite,
      conversationEnds: true,
    };
  }

  /**
   * Determine if dialogue should be consequential based on context
   * Consequential = leads to state changes, encounters, or forced progression
   * Conversational = just relationship building, can exit freely
   */
  analyzeDialogueType(character, state, mcpContext = null) {
    const factors = {
      isConsequential: false,
      reasons: [],
      confidence: 0,
    };

    // High-trust reveals (trust > 70) tend to be consequential
    if (mcpContext?.relationship?.trust > 70) {
      factors.isConsequential = true;
      factors.reasons.push("high_trust_reveal");
      factors.confidence += 0.3;
    }

    // Characters with specific roles often have consequential dialogues
    const consequentialRoles = [
      "guide",
      "shaman",
      "tribal_elder",
      "scientist",
      "priest",
    ];
    if (
      consequentialRoles.some((role) =>
        character.role?.toLowerCase().includes(role)
      )
    ) {
      factors.isConsequential = true;
      factors.reasons.push("consequential_role");
      factors.confidence += 0.2;
    }

    // Low resources make dialogues more likely to be consequential (seeking help)
    if (state.supplies < 30 || state.stamina < 30 || state.morale < 40) {
      factors.isConsequential = true;
      factors.reasons.push("desperate_situation");
      factors.confidence += 0.25;
    }

    // Late-game dialogues (progress > 8) tend to be more consequential
    if (state.progress > 8) {
      factors.isConsequential = true;
      factors.reasons.push("late_game");
      factors.confidence += 0.15;
    }

    // Mission-critical locations suggest consequential dialogues
    const criticalLocations = ["iquitos", "tambopata", "para"];
    const currentLocation = state.route[state.progress];
    if (criticalLocations.some((loc) => currentLocation?.id?.includes(loc))) {
      factors.isConsequential = true;
      factors.reasons.push("critical_location");
      factors.confidence += 0.2;
    }

    // If confidence is low, default to conversational
    if (factors.confidence < 0.4) {
      factors.isConsequential = false;
    }

    return factors;
  }

  /**
   * Generate consequential dialogue that affects game state
   * These conversations can't be exited easily and lead to changes
   * @param {Object} options - Dialogue generation options
   * @param {Object} options.character - Character data
   * @param {Object} options.state - Game state
   * @param {string} options.location - Current location
   * @param {string} options.playerId - Player identifier
   * @param {string} options.consequenceType - Type of consequence (reveal, quest, crisis, opportunity)
   * @param {Database} options.sessionDb - Session database for relationships
   */
  async generateConsequentialDialogue({
    character,
    state,
    location,
    playerId,
    consequenceType = "reveal", // reveal | quest | crisis | opportunity
    sessionDb,
  }) {
    // Get MCP context for relationship info
    let mcpContext = null;
    if (this.mcpTools) {
      try {
        const result = await this.mcpTools.call(
          "character.get_dialogue_context",
          {
            characterId: character.id,
            playerId: playerId || state.playerName,
            location: location || state.location,
            gameDay: state.progress || 1,
          },
          sessionDb // Pass session DB to MCP tool
        );

        if (result.content && result.content[0]?.text) {
          mcpContext = JSON.parse(result.content[0].text);
        }
      } catch (error) {
        console.error("[MCP] Error getting consequential context:", error);
      }
    }

    const systemPrompt = `You are generating CONSEQUENTIAL dialogue for an Amazon expedition game.

CHARACTER: ${character.name} (${character.role})
${character.backstory_template}

CURRENT SITUATION:
Location: ${location || state.location}
Player Status: Morale ${state.morale}/100, Stamina ${
      state.stamina
    }/100, Supplies ${state.supplies}
Progress: ${state.progress}/${state.route.length - 1}
${mcpContext ? `Trust Level: ${mcpContext.relationship?.trust || 0}/100` : ""}

CONSEQUENCE TYPE: ${consequenceType}
${
  consequenceType === "reveal"
    ? "This character has crucial information about the Lágrimas da Lua."
    : ""
}
${
  consequenceType === "quest"
    ? "This character needs help with something urgent."
    : ""
}
${
  consequenceType === "crisis"
    ? "This character brings news of immediate danger."
    : ""
}
${
  consequenceType === "opportunity"
    ? "This character offers a rare chance to advance."
    : ""
}

INSTRUCTIONS:
1. This is a PIVOTAL moment - the dialogue should feel important and consequential
2. The character's information/request/warning should directly affect the journey
3. Provide 3 options that represent REAL CHOICES with different outcomes:
   - One risky/bold option (could advance quickly but has dangers)
   - One cautious/safe option (slower but more secure)
   - One creative/alternative option (unexpected approach)
4. Dialogue should be 100-150 words
5. Make the stakes clear - what happens if player accepts/refuses?
6. Keep tone period-appropriate (1930s Amazon expedition)

Return ONLY valid JSON:
{
  "dialogue": {
    "text": "consequential dialogue here",
    "mood": "worried|excited|serious|urgent",
    "characterAction": "physical action"
  },
  "options": [
    {
      "id": "option1",
      "text": "risky choice",
      "tone": "bold",
      "consequence": "brief description of outcome"
    },
    {
      "id": "option2",
      "text": "safe choice",
      "tone": "cautious",
      "consequence": "brief description of outcome"
    },
    {
      "id": "option3",
      "text": "creative choice",
      "tone": "clever",
      "consequence": "brief description of outcome"
    }
  ],
  "canExit": false,
  "stateChanges": {
    "description": "what will happen after this choice"
  }
}`;

    const userPrompt = `Generate consequential ${consequenceType} dialogue for ${character.name} meeting ${state.playerName}.`;

    try {
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
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No JSON found in consequential dialogue response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Mark as consequential
      parsed.isConsequential = true;
      parsed.consequenceType = consequenceType;

      return parsed;
    } catch (error) {
      console.error("Error generating consequential dialogue:", error);
      // Fallback to regular intro
      return this.generateIntroDialogue({
        character,
        state,
        location,
        playerId,
      });
    }
  }
}
