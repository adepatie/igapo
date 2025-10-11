# MCP Enhancement - Character Context System

## Overview

The MCP (Model Context Protocol) server has been refactored and enhanced to provide rich character context for AI-driven dialogue. This system tracks relationships, conversation history, character knowledge, rumors, and world events to create dynamic, context-aware character interactions.

## Architecture

### Core Components

1. **MCP Server** (`apps/server/src/mcp/server.js`)

   - Central server using `@modelcontextprotocol/sdk`
   - Tool registry system for easy extension
   - Backwards-compatible API for existing narrators

2. **Tool Modules**

   - `amazonDatabase.js` - Amazon ecosystem data tools
   - `characterContext.js` - Character relationship and context tools

3. **Database Schema** (`apps/server/src/database/mcpSchema.js`)
   - 6 new tables for character context tracking
   - Automatic seeding of character knowledge and rumors

## Available MCP Tools

### Amazon Database Tools (6 tools)

1. **amazon_db.get_random_location**

   - Returns random location with biome, dangers, resources
   - Optional biome filter

2. **amazon_db.get_random_animals**

   - Returns animals from specific biome
   - Includes behavior and danger levels
   - Configurable count

3. **amazon_db.get_random_plants**

   - Returns plants with medicinal uses
   - Biome-specific
   - Configurable count

4. **amazon_db.get_location**

   - Get specific location by name
   - Full location details

5. **amazon_db.search_animals**

   - Search animals by name or description
   - Flexible query matching

6. **amazon_db.get_dangerous_animals**
   - Filter animals by danger level
   - Optional biome filter

### Character Context Tools (3 tools)

1. **character.get_dialogue_context**

   - **Most Important Tool** - Call before generating dialogue
   - Returns comprehensive context including:
     - Character details (name, role, archetype, backstory)
     - Relationship status (level, trust, shared secrets)
     - Location context (current environment)
     - Available knowledge (secrets character can reveal)
     - Known rumors (gossip character might share)
     - Recent player actions (what character witnessed)
     - Conversation history (previous interactions)

   **Parameters:**

   - `characterId` (required): Character database ID
   - `playerId` (required): Player identifier
   - `location` (optional): Current location name
   - `gameDay` (optional): Current game day

   **Example Response:**

   ```json
   {
     "character": {
       "id": 1,
       "name": "Kaori",
       "role": "Guide",
       "archetype": "Wise",
       "description": "...",
       "backstory_template": "...",
       "available_moods": ["neutral", "happy", "thoughtful"]
     },
     "relationship": {
       "level": 2,
       "trust": 40,
       "total_interactions": 3,
       "shared_secrets": [],
       "reputation_tags": ["curious", "respectful"],
       "is_first_meeting": false
     },
     "available_knowledge": [
       {
         "id": 5,
         "type": "location_secret",
         "importance": 7,
         "data": { "topic": "safe_paths", "detail": "..." }
       }
     ],
     "known_rumors": [...],
     "recent_player_actions": [...],
     "conversation_history": [...]
   }
   ```

2. **character.update_relationship**

   - Update relationship values after dialogue
   - Tracks trust, relationship level changes
   - Adds reputation tags
   - Marks knowledge as revealed

   **Parameters:**

   - `playerId` (required)
   - `characterId` (required)
   - `relationshipDelta` (optional): Change -10 to +10
   - `trustDelta` (optional): Change 0-100
   - `addReputationTag` (optional): New tag like "trusted"
   - `revealKnowledgeId` (optional): Mark knowledge revealed
   - `gameDay` (optional)

3. **character.record_conversation**

   - Store conversation turn in memory
   - Tracks topics discussed, mood changes
   - Records relationship deltas

   **Parameters:**

   - `playerId`, `characterId`, `sessionId`, `turnNumber` (required)
   - `playerChoiceText`, `characterResponse` (required)
   - `characterMood`, `moodChangeReason` (optional)
   - `topicsDiscussed`, `knowledgeRevealed` (optional arrays)
   - `relationshipDelta`, `location`, `gameDay` (optional)

## Database Schema

### character_relationships

Tracks player-character relationships:

- `relationship_level`: -10 to +10 (enemy to best friend)
- `trust_level`: 0-100 (distrust to complete trust)
- `total_interactions`: Number of conversations
- `shared_secrets`: JSON array of revealed knowledge IDs
- `reputation_tags`: JSON array (e.g., ["curious", "respectful", "brave"])
- `first_met_location`, `first_met_day`: First interaction
- `last_interaction_day`: Most recent interaction

### conversation_memory

Stores every dialogue turn:

- Full text of player choice and character response
- Character mood and mood change reason
- Topics discussed (JSON array)
- Knowledge revealed (JSON array)
- Relationship delta for this turn
- Location and game day

### character_knowledge

Character secrets that can be revealed:

- `knowledge_type`: "location_secret", "mystical_lore", "warning", etc.
- `knowledge_data`: JSON with topic and detail
- `importance`: 1-10 (how significant)
- `reveal_condition`: JSON with requirements (e.g., `{"relationship_min": 5, "trust_min": 60}`)
- `is_revealed`: 0 or 1
- `revealed_by`, `revealed_day`: Tracking

### rumors

Dynamic world information:

- `rumor_text`: The rumor content
- `rumor_type`: "mystery", "lore", "danger", "gossip"
- `subject`: What it's about
- `accuracy`: 0.0-1.0 (how true it is)
- `known_by`: Comma-separated character IDs
- `origin_character_id`: Who started it
- `created_day`, `expires_day`: Lifecycle

### player_actions

Track player's deeds:

- `action_type`: "helped", "hurt", "discovered", "ignored"
- `action_target`: Who/what was affected
- `visibility`: "private", "public", "witnessed"
- `witnesses`: Character IDs who saw it
- `location`, `game_day`

### world_events

Dynamic events affecting gameplay:

- `event_type`: "storm", "festival", "danger", etc.
- `event_description`: What's happening
- `location`: Where it occurs
- `affected_characters`: JSON array
- `trigger_day`, `expiry_day`: When active
- `is_active`: 0 or 1

## Integration Guide

### Step 1: Enhance DialogueNarrator

Update `apps/server/src/gpt/dialogueNarrator.js` to use character context:

```javascript
async generateDynamicTurn(gameState, playerChoice, mcpTools) {
  // Get rich character context
  const contextResult = await mcpTools.call('character.get_dialogue_context', {
    characterId: this.character.id,
    playerId: gameState.playerId || 'player1',
    location: gameState.currentLocation,
    gameDay: gameState.daysElapsed
  });

  const context = JSON.parse(contextResult.content[0].text);

  // Build enhanced system prompt
  const systemPrompt = `You are ${this.character.name}, a ${this.character.role}
in the Amazon rainforest. Your archetype is ${this.character.archetype}.

RELATIONSHIP STATUS:
- Interactions: ${context.relationship.total_interactions}
- Relationship Level: ${context.relationship.level}/10
- Trust Level: ${context.relationship.trust}%
- First met: ${context.relationship.first_met.location || 'Unknown'}
- Is first meeting: ${context.relationship.is_first_meeting}
- Reputation: ${context.relationship.reputation_tags.join(', ') || 'unknown'}

AVAILABLE KNOWLEDGE TO SHARE:
${context.available_knowledge.map(k =>
  `- ${k.type}: ${k.data.topic} (importance: ${k.importance})`
).join('\n')}

RUMORS YOU KNOW:
${context.known_rumors.map(r =>
  `- ${r.type}: ${r.text} (${Math.round(r.accuracy * 100)}% accurate)`
).join('\n')}

CONVERSATION HISTORY:
${context.conversation_history.slice(0, 3).map(h =>
  `Turn ${h.turn}: Player said "${h.player_choice}", you responded with mood ${h.mood}`
).join('\n')}

Based on the relationship level and trust, decide whether to reveal knowledge or share rumors.
Adjust your mood and response based on your relationship with the player.`;

  // Generate response with context
  const response = await this.generateResponse(systemPrompt, playerChoice);

  // Record the conversation
  await mcpTools.call('character.record_conversation', {
    playerId: gameState.playerId || 'player1',
    characterId: this.character.id,
    sessionId: gameState.sessionId,
    turnNumber: gameState.turnNumber,
    playerChoiceText: playerChoice.text,
    characterResponse: response.text,
    characterMood: response.mood,
    location: gameState.currentLocation,
    gameDay: gameState.daysElapsed
  });

  return response;
}
```

### Step 2: Update Relationship After Choices

After player makes a choice, update the relationship:

```javascript
async handlePlayerChoice(choiceId) {
  const choice = dialogue.options.find(o => o.id === choiceId);

  // Determine relationship delta based on choice tone
  let relationshipDelta = 0;
  let trustDelta = 0;

  if (choice.tone === 'respectful') {
    trustDelta = 5;
  } else if (choice.tone === 'aggressive') {
    relationshipDelta = -1;
    trustDelta = -10;
  } else if (choice.tone === 'friendly') {
    relationshipDelta = 1;
    trustDelta = 3;
  }

  // Update relationship
  await mcpTools.call('character.update_relationship', {
    playerId: state.playerId,
    characterId: dialogue.character.id,
    relationshipDelta,
    trustDelta,
    gameDay: state.daysElapsed
  });
}
```

## Current Status

✅ **Completed:**

- MCP server refactored into modular architecture
- 9 tools registered and working
- Database schema created with 6 new tables
- All tables seeded with initial data
- Server running successfully on port 3001
- Frontend dialogue system working
- TypeScript types fixed

🔄 **In Progress:**

- Integration with DialogueNarrator
- Testing character context in actual dialogue

⏳ **Next Steps:**

1. Update DialogueNarrator to call `character.get_dialogue_context`
2. Add relationship updates after each dialogue turn
3. Test full conversation flow with context
4. Add UI to display relationship status
5. Create admin panel to view/edit character knowledge

## Testing

### Manual Test Commands

```bash
# Start development server
npm run dev

# Test MCP tools directly
curl http://localhost:3001/api/test-mcp

# View database
sqlite3 data/amazon.db "SELECT * FROM character_relationships;"
sqlite3 data/amazon.db "SELECT * FROM character_knowledge;"
sqlite3 data/amazon.db "SELECT * FROM rumors;"
```

### Test Scenario

1. Start conversation with a character (first meeting)
2. Check `character_relationships` - should create new row with level 0, trust 0
3. Make respectful choice → relationship should increase
4. Continue conversation → should reference previous interaction
5. Reach relationship level 2 → character reveals basic knowledge
6. Reach trust level 60 → character reveals secrets

## Future Enhancements

1. **Dynamic Rumor Spreading**

   - Rumors spread between characters over time
   - Accuracy degrades as rumors spread
   - Player actions generate new rumors

2. **World Event System**

   - Random events affect character availability
   - Events change character moods
   - Time-limited opportunities

3. **Faction System**

   - Characters belong to factions
   - Helping one character affects reputation with faction
   - Faction-specific knowledge and quests

4. **Memory Decay**

   - Old conversations fade from immediate context
   - Important moments preserved as "memories"
   - Characters forget minor details over time

5. **Emotional Memory**
   - Characters remember how player made them feel
   - Emotional states influence future interactions
   - Grudges and gratitude persist

## Performance Considerations

- Character context tool fetches 5 most recent conversations (not all)
- Knowledge filtered by reveal conditions before sending to AI
- Rumors auto-expire after set number of days
- Consider caching context for same game turn
- Batch relationship updates if multiple characters involved

## Conclusion

The MCP enhancement provides a robust foundation for dynamic, context-aware character interactions. Characters now remember past conversations, track relationships, share secrets based on trust, and respond to player actions in the world. This creates a more immersive and reactive gameplay experience.
