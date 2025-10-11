# DialogueNarrator Enhancement Plan

## Current State

The DialogueNarrator has two main methods:

1. `generateIntroDialogue()` - First meeting with character
2. `generateFollowUpDialogue()` - Continue conversation based on player choice

## Enhancement Strategy

### Phase 1: Add MCP Context to Intro (RECOMMENDED FIRST)

Update `generateIntroDialogue()` to:

1. Call `character.get_dialogue_context` with characterId and playerId
2. Check if `is_first_meeting` is true or false
3. If first meeting: introduce character, create initial relationship
4. If returning: reference previous interactions, adjust greeting based on relationship level

```javascript
async generateIntroDialogue({ character, state, location, mcpTools, playerId }) {
  // Get character context
  const contextResult = await mcpTools.call('character.get_dialogue_context', {
    characterId: character.id,
    playerId: playerId || 'player1',
    location: location || state.location,
    gameDay: state.daysElapsed
  });

  const context = JSON.parse(contextResult.content[0].text);

  // Build enhanced system prompt with relationship context
  const relationshipContext = context.relationship.is_first_meeting
    ? "This is your FIRST TIME meeting this person."
    : `You have met this person ${context.relationship.total_interactions} times before.
       Relationship level: ${context.relationship.level}/10 (${getRelationshipLabel(context.relationship.level)})
       Trust level: ${context.relationship.trust}%
       Last met on day ${context.relationship.last_interaction_day}`;

  const systemPrompt = `...existing prompt...

RELATIONSHIP CONTEXT:
${relationshipContext}

${context.relationship.is_first_meeting ? '' : `
PREVIOUS INTERACTIONS:
${context.conversation_history.slice(0, 2).map(h =>
  `- Day ${h.location}: Player said "${h.player_choice}", you ${h.character_response.substring(0, 50)}...`
).join('\n')}
`}

AVAILABLE KNOWLEDGE TO SHARE (if relationship/trust is high enough):
${context.available_knowledge.slice(0, 3).map(k =>
  `- ${k.type}: ${k.data.topic}`
).join('\n')}

RUMORS YOU MIGHT MENTION:
${context.known_rumors.slice(0, 2).map(r =>
  `- ${r.text}`
).join('\n')}

INSTRUCTIONS:
- Greet the player appropriately (first time vs returning)
- Reference relationship history if applicable
- Adjust helpfulness based on trust level
- Consider sharing rumors or knowledge if trust is high enough
...`;
}
```

### Phase 2: Add Conversation Recording

After dialogue is generated and player makes a choice, record it:

```javascript
async generateFollowUpDialogue({ character, state, selectedOption, previousDialogue, mcpTools, sessionId, turnNumber, playerId }) {
  // Get context first
  const contextResult = await mcpTools.call('character.get_dialogue_context', {
    characterId: character.id,
    playerId: playerId || 'player1',
    gameDay: state.daysElapsed
  });

  const context = JSON.parse(contextResult.content[0].text);

  // Generate dialogue with context...
  const response = await this.generateWithContext(context, selectedOption);

  // Record the conversation turn
  await mcpTools.call('character.record_conversation', {
    playerId: playerId || 'player1',
    characterId: character.id,
    sessionId: sessionId,
    turnNumber: turnNumber,
    playerChoiceId: selectedOption.id,
    playerChoiceText: selectedOption.text,
    playerChoiceTone: selectedOption.tone,
    characterResponse: response.dialogue.text,
    characterMood: response.dialogue.mood,
    location: state.location,
    gameDay: state.daysElapsed,
    topicsDiscussed: extractTopics(response.dialogue.text)
  });

  return response;
}
```

### Phase 3: Update Relationships

Add relationship updates based on player choices:

```javascript
function calculateRelationshipDelta(selectedOption, characterArchetype) {
  let delta = 0;
  let trustDelta = 0;

  // Tone-based changes
  if (selectedOption.tone === 'friendly' || selectedOption.tone === 'respectful') {
    delta = 1;
    trustDelta = 5;
  } else if (selectedOption.tone === 'aggressive' || selectedOption.tone === 'dismissive') {
    delta = -1;
    trustDelta = -10;
  } else if (selectedOption.tone === 'helpful' || selectedOption.tone === 'generous') {
    delta = 2;
    trustDelta = 10;
  }

  // Archetype-specific modifiers
  if (characterArchetype === 'suspicious' && selectedOption.tone === 'cautious') {
    trustDelta += 5; // Suspicious characters appreciate caution
  } else if (characterArchetype === 'playful' && selectedOption.tone === 'humorous') {
    delta += 1; // Playful characters like humor
  }

  return { delta, trustDelta };
}

async updateRelationship(mcpTools, character, playerId, selectedOption, gameDay) {
  const { delta, trustDelta } = calculateRelationshipDelta(selectedOption, character.archetype);

  if (delta !== 0 || trustDelta !== 0) {
    await mcpTools.call('character.update_relationship', {
      playerId: playerId || 'player1',
      characterId: character.id,
      relationshipDelta: delta,
      trustDelta: trustDelta,
      gameDay: gameDay
    });
  }
}
```

### Phase 4: Knowledge Reveal System

When trust reaches thresholds, characters reveal secrets:

```javascript
function shouldRevealKnowledge(knowledge, relationship) {
  if (!knowledge.reveal_condition) return true;

  const condition = knowledge.reveal_condition;

  if (
    condition.relationship_min &&
    relationship.level < condition.relationship_min
  ) {
    return false;
  }

  if (condition.trust_min && relationship.trust < condition.trust_min) {
    return false;
  }

  if (condition.flags_required) {
    const hasAllFlags = condition.flags_required.every((flag) =>
      relationship.reputation_tags.includes(flag)
    );
    if (!hasAllFlags) return false;
  }

  return true;
}

function buildKnowledgePrompt(context) {
  const revealableKnowledge = context.available_knowledge.filter((k) =>
    shouldRevealKnowledge(k, context.relationship)
  );

  if (revealableKnowledge.length === 0) {
    return "You have no special knowledge to share at this trust level.";
  }

  return `KNOWLEDGE YOU CAN REVEAL (if the conversation leads there):
${revealableKnowledge
  .map(
    (k) =>
      `- [ID: ${k.id}] ${k.type}: ${k.data.detail} (Importance: ${k.importance}/10)`
  )
  .join("\n")}

If you reveal any knowledge, include its ID in your response metadata.`;
}
```

## Implementation Order

1. ✅ MCP server and tools created
2. ✅ Database schema and seeding complete
3. ⏳ **NEXT:** Update server.js dialogue endpoints to pass mcpTools and playerId
4. ⏳ **THEN:** Enhance generateIntroDialogue with context
5. ⏳ **THEN:** Add conversation recording
6. ⏳ **THEN:** Add relationship updates
7. ⏳ **THEN:** Test full flow

## Server.js Changes Needed

```javascript
// In /api/dialogue/start endpoint
app.post("/api/dialogue/start", async (req, res) => {
  const { playerId = "player1" } = req.body; // Add playerId to request

  const result = await dialogueNarrator.generateIntroDialogue({
    character,
    state,
    location,
    mcpTools, // Pass mcpTools
    playerId, // Pass playerId
  });

  // Store sessionId for this conversation
  const sessionId = `session_${Date.now()}`;

  res.json({
    ...result,
    sessionId,
    turnNumber: 1,
  });
});

// In /api/dialogue/continue endpoint
app.post("/api/dialogue/continue", async (req, res) => {
  const {
    selectedOption,
    sessionId,
    turnNumber,
    playerId = "player1",
  } = req.body;

  const result = await dialogueNarrator.generateFollowUpDialogue({
    character,
    state,
    selectedOption,
    previousDialogue,
    mcpTools,
    sessionId,
    turnNumber,
    playerId,
  });

  // Update relationship
  await updateRelationship(
    mcpTools,
    character,
    playerId,
    selectedOption,
    state.daysElapsed
  );

  res.json({
    ...result,
    turnNumber: turnNumber + 1,
  });
});
```

## Expected Benefits

1. **Returning Visits Feel Natural**

   - "Ah, it's you again! Still searching for that flower?"
   - "You helped me last time, I won't forget that."

2. **Trust Builds Over Time**

   - Low trust: Generic information, guarded responses
   - Medium trust: Helpful tips, minor secrets
   - High trust: Major secrets, quest information

3. **Player Actions Have Consequences**

   - Aggressive choices → Characters remember and become hostile
   - Helpful choices → Better relationships, more help
   - Reputation spreads between characters

4. **Rich World Building**
   - Characters share rumors they know
   - Knowledge reveals deepen lore
   - Conversations reference past events

## Testing Checklist

- [ ] First meeting creates relationship record
- [ ] Second meeting references first interaction
- [ ] Aggressive choice lowers relationship
- [ ] Friendly choice raises relationship
- [ ] Trust level gates knowledge sharing
- [ ] Conversation history persists
- [ ] Multiple characters maintain separate relationships
- [ ] Relationship level affects greeting style
