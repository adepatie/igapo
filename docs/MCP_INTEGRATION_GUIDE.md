# MCP Integration in Igapó - How It Enriches Gameplay

## What MCP Does For Players

The Model Context Protocol (MCP) integration makes characters in Igapó feel alive and remember you. Here's what changes:

### 🤝 Characters Remember You

**Without MCP:**

- Every conversation starts fresh
- Characters treat you the same way every time
- No sense of building relationships

**With MCP:**

- Characters remember past conversations
- They reference what you talked about before
- First meetings feel different from reunions

**Example:**

- **First meeting:** "Hello, stranger. What brings you to these waters?"
- **Third meeting:** "Ah, the botanist searching for Lágrimas da Lua! Last time you mentioned your grandmother's condition. Any progress?"

### 💬 Relationship Tracking

Your choices affect how characters perceive you:

**Friendly/Respectful Tone:**

- +1 relationship level
- +5 trust points
- Character becomes more helpful and shares more

**Direct/Honest Tone:**

- +3 trust points
- Character appreciates straightforwardness

**Cautious/Suspicious Tone:**

- -2 trust points
- Character becomes guarded

**Rude/Dismissive Tone:**

- -1 relationship level
- -5 trust points
- Character may refuse to help

### 🔐 Secrets Unlock Progressively

Characters have knowledge they'll only share when they trust you:

**Low Trust (0-30):**

- Basic information
- Polite but guarded responses
- No secrets shared

**Medium Trust (31-60):**

- Helpful advice
- Minor rumors and tips
- Some personal stories

**High Trust (61-100):**

- Important secrets about Lágrimas da Lua
- Hidden dangers revealed
- Special items or assistance offered

### 🏷️ Reputation System

Characters tag you based on your behavior:

- **"friendly"** - You're approachable and kind
- **"straightforward"** - You're honest and direct
- **"curious"** - You ask lots of questions
- **"respectful"** - You honor local customs
- **"brave"** - You face dangers head-on
- **"cautious"** - You're careful and thoughtful

Other characters will hear about your reputation!

### 📊 Behind The Scenes

When you talk to a character, the MCP system:

1. **Retrieves context:**

   - Previous conversations you've had
   - Current relationship level (-10 to +10)
   - Trust level (0-100)
   - Your reputation tags

2. **Enriches the prompt:**

   - Claude AI receives all this context
   - Generates responses that fit the relationship
   - References past interactions naturally

3. **Records the conversation:**

   - Saves what was discussed
   - Updates relationship scores
   - Tracks topics and mood changes

4. **Updates relationships:**
   - Your tone affects trust/relationship
   - Reputation tags accumulate
   - Secrets become available at thresholds

## Technical Implementation

### Database Tables

**character_relationships:**

- Tracks your relationship with each character
- Stores trust, friendship level, shared secrets
- Records first meeting location and total interactions

**conversation_memory:**

- Every dialogue turn is saved
- Includes player choices, tones, character responses
- Tracks topics discussed and knowledge revealed

**character_knowledge:**

- Secrets each character knows
- Reveal conditions (trust/relationship thresholds)
- Importance ratings for prioritization

**rumors:**

- Dynamic world information
- Accuracy ratings (some rumors are false!)
- Spreads between characters over time

### MCP Tools Used

1. **`character.get_dialogue_context`**

   - Called before generating each response
   - Provides comprehensive character history
   - Returns available secrets and rumors

2. **`character.update_relationship`**

   - Updates trust and friendship scores
   - Adds reputation tags
   - Marks secrets as revealed

3. **`character.record_conversation`**
   - Saves conversation history
   - Tracks topics and mood changes
   - Builds memory for future interactions

## Testing the Integration

Want to see it in action?

### Experiment 1: Build Trust

1. Start a conversation with a guide character
2. Choose friendly, respectful options
3. Note the character's mood and openness
4. Continue the conversation in another session
5. See how they remember you warmly

### Experiment 2: Damage Relationships

1. Meet a trader character
2. Be rude or dismissive
3. Watch trust decrease
4. Try to talk to them again later
5. Notice the cold reception

### Experiment 3: Unlock Secrets

1. Talk to the same character multiple times
2. Build trust through consistent friendly choices
3. Once trust is high, they'll reveal:
   - Location of rare plants
   - Warnings about dangers
   - Shortcuts or safe paths
   - Mystical lore about Lágrimas da Lua

## Console Logs to Watch

When MCP is working, you'll see:

```
[MCP] Got context for Kaori: { isFirstMeeting: false, relationshipLevel: 3, trustLevel: 45, ... }
[MCP] Updated relationship: +1 relationship, +5 trust
[MCP] Recorded turn 2 for Kaori
```

## What Makes This Special

This isn't just storing data - it's using that data to create **emergent storytelling**:

- Characters have personalities that evolve based on YOUR choices
- The world remembers what you do
- Trust must be earned through consistent behavior
- Secrets feel earned, not scripted
- Each playthrough creates unique relationships

The MCP layer makes Igapó feel less like a branching story and more like a living world where your reputation precedes you.
