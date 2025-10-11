# 🎮 Hybrid System Quick Reference

## For Future Development

### Adding a New Action

**File**: `apps/server/src/game/actionManager.js`

```javascript
// Add to appropriate category array (MOVEMENT_ACTIONS, SOCIAL_ACTIONS, etc.)
{
  id: "my_new_action",
  category: "special", // movement | social | survival | special
  label: "Do Something Cool",
  description: "This action does something cool!",
  deltas: {
    stamina: -5,
    morale: +10,
    progress: +1
  },
  requirements: {
    stamina: { min: 10 }, // Optional
    supplies: { min: 20 }  // Optional
  },
  mode_transition: { // Optional - triggers mode change
    to: "exploration",
    context: { turnsRemaining: 3 }
  }
}
```

### Adding a New Mode Transition

**File**: `apps/server/src/game/modeManager.js`

```javascript
// Add to appropriate transition function
export const transitionFromMyMode = (state, result) => {
  const nextState = { ...state };

  // Apply changes from your mode
  if (result.myData) {
    // Do something with result
  }

  // Determine next mode
  if (result.triggersDialogue) {
    nextState.currentMode = "dialogue";
    return { state: nextState, mode: "dialogue", reason: "my_reason" };
  }

  // Default return to action
  nextState.currentMode = "action";
  return { state: nextState, mode: "action", reason: "complete" };
};
```

### Creating Consequential Dialogue

Consequential dialogues are automatically determined by `analyzeDialogueType()` based on:

- Trust level > 70
- Character role (guide, shaman, elder, etc.)
- Low resources (supplies < 30, stamina < 30, morale < 40)
- Late game (progress > 8)
- Critical locations (iquitos, tambopata, para)

To manually trigger:

```javascript
// In a new API endpoint or transition
const dialogueData = await dialogueNarrator.generateConsequentialDialogue({
  character,
  state,
  location,
  playerId,
  consequenceType: "reveal", // reveal | quest | crisis | opportunity
});
```

### Adding a New API Endpoint

**File**: `apps/server/src/server.js`

```javascript
// Add after existing hybrid system endpoints
app.post(
  "/api/mymode/myaction",
  asyncHandler(async (req, res) => {
    const validatedState = validateGameState(req.body.state);

    // Your logic here

    res.json({
      state: transformStateForFrontend(nextState),
      // Your response data
    });
  })
);
```

### Adding Frontend API Function

**File**: `apps/web/src/game-client/api.ts`

```typescript
export async function myNewApiCall(
  state: HybridGameState,
  params: MyParams
): Promise<MyResponse> {
  const response = await fetch(createApiUrl("/api/mymode/myaction"), {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ state, ...params }),
  });

  return handleResponse<MyResponse>(response);
}
```

### Adding UI for a New Mode

**File**: `apps/web/src/AppHybrid.tsx`

```typescript
// In the render section, add:
{
  currentMode === "mymode" && (
    <MyModeComponent
      state={state}
      onAction={handleMyModeAction}
      isProcessing={loading}
    />
  );
}
```

## Key Patterns

### State Updates

Always use immutability:

```javascript
const nextState = { ...state };
nextState.morale = clamp(nextState.morale + delta, 0, 100);
```

### Mode Transitions

Always call `handleModeTransition`:

```javascript
const transition = handleModeTransition(state, fromMode, result);
setPendingTransition(transition.modeTransition);
```

### Error Handling

Always wrap in try-catch:

```javascript
try {
  const response = await apiCall();
  setState(response.state);
} catch (err) {
  console.error("[Component] Error:", err);
  setError(err instanceof Error ? err.message : "Operation failed");
}
```

## Testing Checklist

When adding new features:

- [ ] Does it work in isolation?
- [ ] Does it transition correctly to other modes?
- [ ] Does it preserve state across transitions?
- [ ] Does it update stats appropriately?
- [ ] Does it log errors clearly?
- [ ] Does it handle loading states?
- [ ] Does the UI feel responsive?
- [ ] Can the player undo/exit if needed?

## Common Issues

### Action not appearing

- Check `requirements` - player may not meet them
- Check category filtering in UI
- Check if dynamic generation logic excludes it

### Mode transition not working

- Check `modeTransition` object structure
- Check `handleModeTransition` routing
- Check that `currentMode` is being updated

### State not updating

- Check immutability - don't mutate state directly
- Check `transformStateForFrontend` - may be filtering fields
- Check that API returns full state object

### MCP tools not working

- Check `app.locals.mcpTools` is set in server startup
- Check that endpoint accesses `req.app.locals.mcpTools`
- Check MCP tool call syntax matches registered tools

## Files to Modify Most Often

For gameplay tuning:

1. `apps/server/src/game/actionManager.js` - Add/modify actions
2. `apps/server/src/game/modeManager.js` - Adjust transitions
3. `apps/server/src/gpt/dialogueNarrator.js` - Tune consequential detection

For UI polish:

1. `apps/web/src/components/ActionMenu.tsx` - Action UI
2. `apps/web/src/components/ModeTransitionBanner.tsx` - Transitions
3. `apps/web/src/AppHybrid.tsx` - Overall flow

For new features:

1. `apps/server/src/server.js` - API endpoints
2. `apps/web/src/game-client/api.ts` - API client
3. `apps/web/src/game-client/types.ts` - Type definitions

## Architecture Principles

1. **Modes are isolated** - Each mode has its own UI and logic
2. **Transitions are explicit** - Always use transition banner
3. **State is immutable** - Never mutate, always copy
4. **Context is preserved** - State carries through all modes
5. **Consequences are clear** - Show deltas and outcomes
6. **Errors are graceful** - Always have fallbacks
7. **MCP enhances** - Use MCP to enrich, not replace

## Quick Wins

Want to improve the game quickly?

1. **Add more actions** - Takes 5 minutes per action
2. **Tune deltas** - Adjust stamina/morale/supplies costs
3. **Add dynamic actions** - New location-based actions
4. **Improve messages** - Better transition text
5. **Polish animations** - CSS transitions
6. **Add sound effects** - Mode change sounds
7. **Improve mobile** - Responsive CSS tweaks

## Resources

- **Full docs**: `docs/HYBRID_SYSTEM_IMPLEMENTATION.md`
- **Success metrics**: `docs/IMPLEMENTATION_SUCCESS.md`
- **MCP integration**: `docs/MCP_IMPLEMENTATION_SUMMARY.md`
- **Server URL**: http://localhost:3001
- **Frontend URL**: http://localhost:5173

---

**Remember**: The system is designed to be extended. Start small, test thoroughly, and build incrementally! 🚀
