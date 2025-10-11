# MCP Integration - Implementation Summary

## Changes Made

### 1. DialogueNarrator.js - Core Integration

**Constructor Update:**

```javascript
constructor(options = {}) {
  // ... existing code ...
  this.mcpTools = options.mcpTools || null;
}
```

**generateIntroDialogue() - Enhanced with MCP:**

- Calls `character.get_dialogue_context` to retrieve:
  - Relationship history (first meeting vs. reunion)
  - Trust levels and friendship scores
  - Previous conversation history
  - Available secrets based on trust level
  - Known rumors character can share
- Injects context into system prompt
- Records conversation after generation

**Key Features Added:**

- First meetings are distinguished from reunions
- Characters reference past conversations
- Available knowledge/secrets listed for AI
- Conversation is recorded for future reference

**generateFollowUpDialogue() - Relationship Tracking:**

- Retrieves current relationship status
- Calculates relationship impact based on player tone:
  - Friendly/Respectful: +1 relationship, +5 trust
  - Direct/Honest: +3 trust
  - Cautious/Suspicious: -2 trust
  - Rude/Dismissive: -1 relationship, -5 trust
- Updates relationship after dialogue
- Records turn with topics discussed
- Adds reputation tags ("friendly", "straightforward", etc.)

**New Helper Method:**

- `extractTopics(text)` - Identifies conversation themes for memory

### 2. Server.js - MCP Tools Integration

**Narrator Initialization:**

```javascript
// Wait for MCP tools to initialize
async function startServer() {
  mcpTools = await registerAllTools(db);

  // Reinitialize with MCP tools
  dialogueNarrator = new DialogueNarrator({ mcpTools });
}
```

**API Endpoint Updates:**

- `/api/dialogue/start` - Passes `playerId` for tracking
- `/api/dialogue/continue` - Passes `playerId` and `turnNumber`
- `/api/dialogue/new-character` - Passes `playerId` for continuity

All endpoints now support relationship tracking across conversations.

## How It Works

### Flow Diagram

```
Player starts conversation
        ↓
[GET CONTEXT] character.get_dialogue_context()
        ├─ Is first meeting?
        ├─ What's relationship level?
        ├─ What was discussed before?
        ├─ What secrets can be shared?
        └─ What rumors does character know?
        ↓
[GENERATE] DialogueNarrator.generateIntroDialogue()
        ├─ Build enriched prompt with context
        ├─ Call Claude AI
        └─ Parse response
        ↓
[RECORD] character.record_conversation()
        ├─ Save dialogue text
        ├─ Track topics discussed
        └─ Store turn metadata
        ↓
Player selects option
        ↓
[ANALYZE TONE] Calculate relationship impact
        ├─ Friendly → +relationship, +trust
        ├─ Cautious → -trust
        └─ Rude → -relationship, -trust
        ↓
[GET CONTEXT] (again for follow-up)
        ↓
[GENERATE] DialogueNarrator.generateFollowUpDialogue()
        ↓
[UPDATE] character.update_relationship()
        ├─ Apply relationship deltas
        ├─ Apply trust deltas
        └─ Add reputation tag
        ↓
[RECORD] Save turn
        ↓
Conversation continues or ends
```

## Data Structures

### MCP Context Response

```javascript
{
  character: { /* basic info */ },
  relationship: {
    level: 2,              // -10 to +10
    trust: 45,             // 0-100
    total_interactions: 3,
    shared_secrets: [],
    reputation_tags: ["friendly", "curious"],
    is_first_meeting: false
  },
  available_knowledge: [
    {
      id: 5,
      type: "location_secret",
      importance: 7,
      data: { /* secret details */ }
    }
  ],
  known_rumors: [ /* rumors */ ],
  conversation_history: [
    {
      turn: 1,
      player_choice: "Tell me about the river",
      character_response: "...",
      topics: ["navigation", "dangers"]
    }
  ]
}
```

### Tone Impact Map

```javascript
{
  'friendly': { relationship: +1, trust: +5, tag: 'friendly' },
  'respectful': { relationship: +1, trust: +5, tag: 'friendly' },
  'direct': { trust: +3, tag: 'straightforward' },
  'cautious': { trust: -2 },
  'rude': { relationship: -1, trust: -5 }
}
```

## Testing Checklist

### Basic Functionality

- [ ] Start conversation with character
- [ ] See console log: `[MCP] Got context for [Name]`
- [ ] Character mentions it's first meeting
- [ ] Select friendly option
- [ ] See console log: `[MCP] Updated relationship: +1 relationship, +5 trust`
- [ ] Continue conversation

### Relationship Progression

- [ ] Talk to same character multiple times
- [ ] Verify relationship level increases
- [ ] Check database: `SELECT * FROM character_relationships`
- [ ] Verify trust increases with friendly choices
- [ ] Try rude choice, see trust decrease

### Memory System

- [ ] Have conversation about specific topic
- [ ] End conversation
- [ ] Talk to character again in new session
- [ ] Verify character references previous conversation
- [ ] Check database: `SELECT * FROM conversation_memory`

### Secret Unlocking

- [ ] Build trust to 60+ with a character
- [ ] Character should share more detailed information
- [ ] Check console for available_knowledge in context
- [ ] Verify secrets mentioned in dialogue

## Console Output Example

When working correctly:

```
✅ MCP tools registered: 9 tools available
✅ DialogueNarrator initialized with MCP tools
[MCP] Got context for Miguel: {
  isFirstMeeting: true,
  relationshipLevel: 0,
  trustLevel: 0,
  availableKnowledge: 2,
  knownRumors: 1
}
[MCP] Recorded intro conversation for Miguel

[MCP] Got context for Miguel: {
  isFirstMeeting: false,
  relationshipLevel: 1,
  trustLevel: 5,
  availableKnowledge: 2,
  knownRumors: 1
}
[MCP] Updated relationship: +1 relationship, +5 trust
[MCP] Recorded turn 2 for Miguel
```

## Database Queries for Verification

### Check relationships

```sql
SELECT
  cr.*,
  c.name,
  c.role
FROM character_relationships cr
JOIN characters c ON c.id = cr.character_id
WHERE cr.player_id = 'YourPlayerName';
```

### Check conversation history

```sql
SELECT
  turn_number,
  player_choice_text,
  player_choice_tone,
  character_mood,
  topics_discussed,
  relationship_delta
FROM conversation_memory
WHERE player_id = 'YourPlayerName'
ORDER BY timestamp DESC
LIMIT 10;
```

### Check available knowledge

```sql
SELECT
  ck.*,
  c.name as character_name
FROM character_knowledge ck
JOIN characters c ON c.id = ck.character_id
WHERE ck.is_revealed = 0;
```

## Performance Considerations

- MCP calls add ~100-200ms per dialogue turn
- Context retrieval is database query + JSON parsing
- Relationship updates are minimal (single UPDATE query)
- Conversation recording is INSERT operation

Total overhead: ~200-300ms per turn (acceptable for turn-based game)

## Future Enhancements

### Phase 2 - Advanced Features

- [ ] Character-to-character relationship tracking
- [ ] Rumors spread between characters over time
- [ ] Player actions affect multiple relationships
- [ ] Location-specific knowledge unlocking
- [ ] Time-based relationship decay (if player ignores character)

### Phase 3 - Deep Integration

- [ ] Characters react to player's reputation before meeting
- [ ] Group conversations (multiple characters present)
- [ ] Character alliances and conflicts
- [ ] Quest chains based on relationship thresholds
- [ ] Betrayal mechanics (characters with negative relationships)

## Debugging Tips

**If MCP context isn't loading:**

1. Check console for `[MCP]` logs
2. Verify `mcpTools` is not null in DialogueNarrator
3. Check database has MCP tables
4. Verify character ID matches database

**If relationships aren't updating:**

1. Check tone mapping in `generateFollowUpDialogue`
2. Verify `character.update_relationship` is called
3. Check database for relationship record
4. Look for MCP error logs

**If conversations aren't recorded:**

1. Check `character.record_conversation` call
2. Verify all required parameters passed
3. Check database conversation_memory table
4. Look for JSON parsing errors in logs
