# UI Architecture - Hybrid Game System

## Overview

The Igapó game client uses a **layered modal architecture** that combines persistent UI elements with overlay modals for different game modes. This architecture provides a consistent visual experience while allowing different interaction patterns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     AppHybrid.tsx                        │
│                  (Main Orchestrator)                     │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ StatsSidebar │   │ LocationScene│   │ Modal System │
│   (Fixed)    │   │  (Base Layer)│   │  (Overlays)  │
└──────────────┘   └──────────────┘   └──────────────┘
                            │                   │
                            ▼                   │
                   ┌──────────────┐            │
                   │ActionMenuBar │            │
                   │ (Bottom Bar) │            │
                   └──────────────┘            │
                                               │
        ┌──────────────────┬──────────────────┼──────────────────┐
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│DialogueModal │  │Exploration   │  │Encounter     │  │Reflection    │
│              │  │Modal         │  │Modal         │  │Modal         │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

## Component Hierarchy

### Layer 1: Persistent Base (Always Visible)

#### **LocationScene** (Base Layer)

- **Purpose**: Display current location, biome, and atmosphere
- **Visibility**: Always visible, dims when modals are active
- **Contains**:
  - Location name and description
  - Biome information
  - Background scenery
  - ActionMenuBar (child)
- **Props**: `location`, `timeOfDay`, `hasActiveModal`, `children`

#### **ActionMenuBar** (Bottom Persistent)

- **Purpose**: Category-based action selection
- **Visibility**: Always visible at bottom (unless special modal active)
- **Features**:
  - 4 action categories: Movement, Social, Survival, Special
  - Action popover appears above bar when category selected
  - Shows action count badges
  - Displays action effects (stamina, morale, supplies)
- **Props**: `actions`, `onSelectAction`, `isProcessing`, `disabled`

#### **StatsSidebar** (Right Fixed)

- **Purpose**: Display player stats
- **Visibility**: Always visible
- **Shows**: Morale, Stamina, Supplies, Progress counter

### Layer 2: Modal Overlays (Contextual)

All modals share common patterns:

- Full-screen backdrop with blur
- Centered modal card
- Focus trap (Tab navigation contained)
- Keyboard shortcuts (Escape to close, Enter for primary action)
- Auto-focus on first interactive element
- ARIA attributes for accessibility

#### **DialogueModal** (Dialogue Mode)

- **Purpose**: Character conversations and story moments
- **Visual Theme**: Blue-gray gradient
- **Features**:
  - Character portrait and name
  - Mood emoji with character action
  - Dialogue text display
  - 3 response options with tone indicators
  - Consequential decision badge
- **Props**: `character`, `mood`, `dialogueText`, `characterAction`, `options`, `onSelectOption`, `isProcessing`, `isConsequential`
- **Keyboard**: Escape (if onClose provided), Tab for option navigation

#### **ExplorationModal** (Exploration Mode)

- **Purpose**: 3-turn area investigation system
- **Visual Theme**: Green/emerald nature colors
- **Features**:
  - Location name and description
  - Turns remaining counter
  - 4 action buttons: Search, Observe, Rest, Leave
  - Items found display (grows as items discovered)
  - Action effects preview
- **Props**: `location`, `description`, `turnsRemaining`, `itemsFound`, `onAction`, `isProcessing`
- **Keyboard**: Escape to leave, Tab for action navigation

#### **EncounterModal** (Encounter Mode)

- **Purpose**: Handle danger/opportunity/mystery events
- **Visual Themes**:
  - Danger: Red gradient with red glow
  - Opportunity: Green gradient with green glow
  - Mystery: Purple gradient with purple glow
- **Features**:
  - Type-specific icon and title
  - Turns remaining counter (when unresolved)
  - Resolved badge (when complete)
  - Risk-labeled options (low/medium/high)
  - Dramatic entrance animation
- **Props**: `type`, `description`, `turnsRemaining`, `resolved`, `options`, `onSelectOption`, `isProcessing`
- **Keyboard**: Tab for option navigation

#### **ReflectionModal** (Reflection Mode)

- **Purpose**: Display dreams, journal entries, memories
- **Visual Themes**:
  - Dream: Purple gradient with soft glow
  - Journal: Amber/brown with warm glow
  - Memory: Blue gradient with cool glow
- **Features**:
  - Elegant literary design
  - First-letter drop caps
  - Staggered paragraph animations
  - Justified text with indentation
  - Floating icon animation
  - Continue button
- **Props**: `type`, `content`, `title`, `onContinue`, `isProcessing`
- **Keyboard**: Enter to continue

## State Management

### Game State Flow

```
User Action → AppHybrid → API Call → Server Response → State Update → UI Update
```

**AppHybrid.tsx** manages:

- `gameState: HybridGameState` - Current game state from server
- `dialogue: DialogueResponse | null` - Active dialogue data
- `activeModal: GameMode | null` - Which modal is currently shown
- `loading: boolean` - API request state
- `error: string | null` - Error messages

### Mode Transitions

The game uses `currentMode` and `modeContext` to track which modal should be shown:

```typescript
type GameMode =
  | "dialogue"
  | "action"
  | "exploration"
  | "encounter"
  | "reflection";

interface ModeContext {
  dialogue: { characterId; turnNumber; canExit; isConsequential };
  action: { availableCategories; lastCategory };
  exploration: { areaId; itemsFound; turnsRemaining };
  encounter: { type; turnsRemaining; resolved };
  reflection: { type; triggered };
}
```

**Modal Display Logic:**

```typescript
// In AppHybrid.tsx
const activeModal = gameState?.currentMode === "dialogue" ? "dialogue" : null;

{
  activeModal === "dialogue" && dialogue && (
    <DialogueModal {...dialogueProps} />
  );
}
```

## Type System

### Core Types (types.ts)

**Shared Types:**

```typescript
Location { id, name, biome, description }
Character { id, name, role, archetype, description, backgroundImage }
DialogueOption { id, text, tone, outcomes }
GameAction { id, label, description, category, deltas, mode_transition }
```

**Modal-Specific Types:**

```typescript
DialogueResponse { text, mood, character, options, conversationEnds, isConsequential }
ExplorationStartResponse { state, exploration: { location, description, turnsRemaining } }
ExplorationResult { action, findings, turnsRemaining }
Encounter { type: "danger" | "opportunity" | "mystery" }
```

## Styling System

### CSS Architecture

**Global Design Variables:** `styles/variables.css`

- Color palette (backgrounds, text, borders, accents)
- Spacing scale (xs to 2xl)
- Typography system
- Border radius values
- Shadow levels
- Transition speeds
- Z-index layers

**Component-Specific CSS:**

- Each modal has its own `.css` file
- Follows BEM-like naming: `.modal-name__element--modifier`
- Uses CSS variables for maintainability
- Mobile-responsive with `@media (max-width: 768px)`

### Modal Styling Pattern

All modals follow this structure:

```css
.modal-backdrop {
  /* Full screen overlay */
}
.modal {
  /* Card container */
}
.modal-header {
  /* Top section with title */
}
.modal-content {
  /* Scrollable main content */
}
.modal-actions {
  /* Bottom action buttons */
}
.modal-processing {
  /* Loading indicator */
}
```

**Animation Standards:**

- Backdrop: 0.3s fade-in
- Modal entrance: 0.4-0.6s slide/scale/blur
- Hover transitions: 0.2s
- Processing indicators: 1s spin

## Accessibility Features

### ARIA Implementation

**All Modals Include:**

- `role="dialog"` or `role="alertdialog"` (encounters)
- `aria-modal="true"` - Indicates modal behavior
- `aria-labelledby` - Links to title element
- `aria-describedby` - Links to description element
- `aria-live="polite"` - For dynamic status updates
- `aria-hidden="true"` - For decorative elements

**Interactive Elements:**

- Descriptive `aria-label` on all buttons
- `aria-pressed` for toggle buttons
- `role="group"` for related controls
- `role="status"` for loading indicators

### Keyboard Navigation

**Universal Patterns:**

- **Tab/Shift+Tab**: Navigate between focusable elements
- **Focus Trap**: Tab/Shift+Tab cycles within modal only
- **Auto-Focus**: First interactive element focused on modal open

**Modal-Specific:**

- **DialogueModal**: Escape to close (when allowed)
- **ExplorationModal**: Escape to leave exploration
- **EncounterModal**: Focus trap only (no escape)
- **ReflectionModal**: Enter to continue

### Screen Reader Support

**Semantic HTML:**

- `<nav>` for ActionMenuBar
- `<main>` for LocationScene
- `<dialog>` roles for modals
- Proper heading hierarchy (`<h1>`, `<h2>`)

**Descriptive Labels:**

- Character mood emojis: "Mood: happy"
- Action effects: "Move forward - Advance 1 turn. Effects: -2 stamina"
- Risk levels: "High Risk" for dangerous encounters

## Component Communication

### Props Flow

```
AppHybrid (state owner)
    ↓ props
LocationScene (presentational)
    ↓ props
ActionMenuBar (event emitter)
    ↑ onSelectAction
AppHybrid (handles action)
```

### Event Handlers

**DialogueModal:**

- `onSelectOption(optionId: string)` - User chooses dialogue option
- `onClose?()` - Optional close handler (not always available)

**ExplorationModal:**

- `onAction(action: "search" | "observe" | "rest" | "leave")` - Exploration action

**EncounterModal:**

- `onSelectOption(optionId: string)` - Encounter resolution choice

**ReflectionModal:**

- `onContinue()` - Dismiss reflection and continue

**ActionMenuBar:**

- `onSelectAction(actionId: string)` - User selects an action from a category

## Testing Strategy

### E2E Tests (Playwright)

**Test Files:**

- `dialogue-flow.spec.ts` - Tests dialogue modal interactions
- `journey.spec.ts` - Tests full game flow (needs update for new modals)

**Test Coverage:**

- ✅ Modal appearance and dismissal
- ✅ Character display (name, mood, portrait)
- ✅ Dialogue option selection
- ✅ Stats sidebar visibility
- ✅ Error handling
- ⏳ Exploration modal (to be added)
- ⏳ Encounter modal (to be added)
- ⏳ Reflection modal (to be added)

### Testing Selectors

**Prefer (in order):**

1. `data-testid` attributes (most reliable)
2. Semantic roles (`role="dialog"`)
3. ARIA labels (`aria-label`)
4. CSS classes (least reliable, can change)

**Current Test IDs:**

```typescript
// DialogueModal
data-testid="dialogue-scene"
data-testid="character-portrait"
data-testid="character-mood"
data-testid="dialogue-options"
```

## Mobile Responsiveness

### Breakpoints

- **Desktop**: Default styles (> 768px)
- **Tablet/Mobile**: `@media (max-width: 768px)`

### Mobile Adaptations

**All Modals:**

- Reduced padding (1.5rem → 1rem)
- Smaller font sizes (1.75rem → 1.5rem for titles)
- Max height increased (85vh → 90-95vh)

**ExplorationModal:**

- Action grid: 2 columns → 1 column

**EncounterModal:**

- Header: Horizontal → Vertical stack
- Options: Side-by-side → Stacked

**ReflectionModal:**

- Reduced drop cap size (3.5rem → 2.5rem)

## Development Workflow

### Adding a New Modal

1. **Create Component**: `components/NewModal.tsx`

   ```typescript
   interface NewModalProps {
     /* props */
   }
   function NewModal({ ...props }: NewModalProps) {
     // Focus trap setup
     // Keyboard handler setup
     return (
       <div role="dialog" aria-modal="true">
         ...
       </div>
     );
   }
   ```

2. **Create Styles**: `components/NewModal.css`

   - Use existing modal patterns
   - Include backdrop, modal card, header, content, actions
   - Add mobile responsive breakpoint

3. **Add Type Definitions**: `game-client/types.ts`

   ```typescript
   export interface NewModeResponse {
     /* API response shape */
   }
   ```

4. **Wire Up in AppHybrid**: `AppHybrid.tsx`

   ```typescript
   {
     activeModal === "newMode" && <NewModal {...props} />;
   }
   ```

5. **Add Tests**: `tests/e2e/new-modal.spec.ts`

### Code Style Guidelines

**TypeScript:**

- Use explicit types for props interfaces
- Prefer `interface` over `type` for object shapes
- Use union types for string literals: `"option1" | "option2"`

**React:**

- Functional components with hooks
- `useRef` for DOM references
- `useEffect` for side effects (keyboard, focus)
- Props destructuring in function signature

**CSS:**

- Mobile-first or desktop-first (be consistent)
- Use CSS variables from `variables.css`
- BEM-like naming: `.component__element--modifier`
- Group related styles with comments

**Accessibility:**

- Always include ARIA attributes
- Test with keyboard navigation
- Provide descriptive labels
- Hide decorative elements from screen readers

## Performance Considerations

### Optimization Strategies

1. **Conditional Rendering**: Only render active modal

   ```typescript
   {
     activeModal === "dialogue" && <DialogueModal />;
   }
   ```

2. **CSS Animations**: Use `transform` and `opacity` (GPU-accelerated)

   ```css
   animation: modalSlideUp 0.4s ease; /* Uses transform */
   ```

3. **Focus Management**: Minimize reflows

   ```typescript
   useEffect(() => {
     firstElementRef.current?.focus();
   }, [options]);
   ```

4. **Event Listeners**: Clean up in useEffect return
   ```typescript
   useEffect(() => {
     document.addEventListener("keydown", handler);
     return () => document.removeEventListener("keydown", handler);
   }, [deps]);
   ```

## Future Enhancements

### Planned Features

- [ ] Animation preferences (reduce motion for accessibility)
- [ ] Sound effects for modal transitions
- [ ] Modal transition animations between modes
- [ ] Persistent notification system (toasts)
- [ ] Mobile gesture support (swipe to dismiss)
- [ ] Gamepad/controller support
- [ ] Customizable themes (color schemes)
- [ ] Portrait/landscape orientation handling

### Refactoring Opportunities

- [ ] Extract shared modal base component
- [ ] Create reusable focus trap hook
- [ ] Consolidate keyboard handler logic
- [ ] Build modal animation library
- [ ] Create component testing utilities
- [ ] Add Storybook for component documentation

## Troubleshooting

### Common Issues

**Modal Not Appearing:**

- Check `activeModal` state matches modal condition
- Verify `z-index` layers (modals should be 1000+)
- Check console for TypeScript errors

**Focus Not Trapping:**

- Ensure `modalRef` is attached to modal root
- Verify focusable elements query selector
- Check useEffect dependencies array

**Keyboard Shortcuts Not Working:**

- Confirm event listener is attached to `document`
- Check event is not being prevented elsewhere
- Verify cleanup in useEffect return

**ARIA Warnings:**

- Run aXe DevTools or Lighthouse audit
- Check all interactive elements have labels
- Ensure proper role hierarchy

**Mobile Layout Issues:**

- Test at exact breakpoint (768px)
- Check viewport meta tag in HTML
- Verify touch targets are 44x44px minimum

## Resources

### External Documentation

- [ARIA Authoring Practices Guide - Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [React Accessibility](https://react.dev/learn/accessibility)
- [Playwright Testing](https://playwright.dev/docs/intro)

### Internal Files

- `types.ts` - All TypeScript interfaces
- `variables.css` - Design system tokens
- `api.ts` - API client functions
- `AppHybrid.tsx` - Main orchestrator

---

**Document Version:** 1.0  
**Last Updated:** October 11, 2025  
**Authors:** UI Refactoring Team
