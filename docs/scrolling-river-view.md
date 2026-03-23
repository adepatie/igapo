# Scrolling River View

## Purpose

The primary game view is a forward-facing perspective of the river. The player's boat is stationary on screen; the river scrolls toward them. Banks slide past. Trees lean in. The horizon is water.

This replaces the overhead click-map as the primary navigation interface. The overhead map becomes a reference-only overlay. The player is no longer managing the river from above — they are on it.

**Reference:** The original Amazon Trail (MECC, 1996) — forward perspective scrolling river view.

**Existing code to extend/replace:** `apps/web/src/systems/RiverMap.ts`, `apps/web/src/scenes/MapScene.ts`

---

## Visual Paradigm

The view is a perspective projection of the river ahead. Key visual elements:

- **The river**: water surface scrolling toward the player, with texture (current patterns, debris, color reflecting region and season)
- **The banks**: left and right treelines sliding past, with vegetation appropriate to the region
- **The sky**: ambient light reflecting time of day, weather state, and season
- **The boat's bow**: the player's perspective anchor — always at the bottom of the frame, suggesting the boat
- **Ambient elements**: birds, insects, water sounds (from existing AmbientSound system), atmospheric particles (rain, mist)

Visual style shifts with world state:
- **Várzea / wet season**: copper-colored water, flooded treeline, high banks
- **Igapó**: dark black water, close overhanging trees, dimmer ambient light
- **Terra firme**: clearer water, higher banks, more sky visible
- **Night**: moonlight on water, star field, reduced bank visibility
- **Storm**: grey sky, chop on the water, rain streaks across the view, reduced horizon distance

---

## Movement States

The river view operates in four states:

```typescript
type RiverMovementState =
  | "TRAVELING"    // river scrolling, player in transit between nodes
  | "APPROACHING"  // hub node visible ahead, river slowing, synopsis prompt appearing
  | "STOPPED"      // at a shore hub or post-encounter; river paused; encounter UI active
  | "INTERRUPTED"  // transit random encounter fired; river paused; encounter UI active
```

### TRAVELING
The river scrolls continuously. Scroll speed is constant (representing steady boat travel). The HUD shows resources and current conditions. No interaction required — the player watches the river go by.

Random encounter probability accumulates with distance traveled. When the roll fires, state transitions to INTERRUPTED.

### APPROACHING
A hub node has entered the visible range ahead. The river begins to slow (visual only — travel time is not extended). A synopsis prompt appears at the bottom of the frame: a brief description of what the player sees, and two buttons:

```
[Stop here]    [Continue on]
```

If the player does not interact within a threshold distance, the boat passes the node and resumes TRAVELING without stopping.

The approaching visual: the hub is visible as a silhouette growing on the bank — the dock, the treeline break, the smoke. The player has a moment of recognition before the choice.

### STOPPED
The river has stopped scrolling. The player is at a shore hub. The full encounter UI loads — identical to the existing EncounterScene but integrated into the river view rather than a separate scene. The encounter panel slides in from the side or overlays the river view.

When the encounter resolves (player makes a choice, outcomes are shown), the player can:
- Return to the river (resume TRAVELING)
- Enter deeper (if the encounter opened land exploration — a sub-hub structure)

### INTERRUPTED
A transit random encounter has fired. The river stops. An encounter panel appears. The player resolves it. The river resumes.

Interrupted encounters are visually distinct from shore hubs — they appear to emerge from the environment (a sound from the bank, something in the water ahead, crew motion on deck) rather than the player approaching something on the shore.

---

## Shore Hub Approach in Detail

The approach window is approximately 3 seconds of deceleration. During this time:

1. The hub silhouette grows visible ahead
2. The synopsis appears: 1–2 sentences describing what the player sees from the water
3. The stop/continue choice is presented

The synopsis text is drawn from the selected encounter variant's `synopsis` field. It is deliberately brief — enough to make an informed choice, not enough to spoil the encounter.

Examples:
- "A weathered dock. Smoke from a cookfire. Someone watching from the bank."
- "The village you helped last season. They've strung colored cloth along the waterfront."
- "An abandoned landing. The dock is half-collapsed. No sign of recent use."

The third example — a node that had a settlement but shows abandonment — is world state reflecting event log history. The synopsis is selected by the variant system the same way encounter text is.

**If the player chooses "Continue on"**: the boat passes the hub without stopping. A `node_passed` event is written to the event log (the run-local cache). The hub may have context on it — the player glimpses something but doesn't know what. The scrolling resumes.

**If the player chooses "Stop here"**: state transitions to STOPPED. The full encounter loads.

---

## Fork Encounter Presentation

When the scrolling view approaches a fork node, the visual shows the river dividing ahead. Two channels are visible, both extending toward the horizon. The river slows.

A fork encounter panel appears, presenting both channels:

```
┌─────────────────────────────────────────────┐
│                                             │
│  The river divides here.                   │
│                                             │
│  LEFT CHANNEL                               │
│  Wider. The current looks slower. Dark      │
│  water ahead — igapó forest on both banks.  │
│                                             │
│  RIGHT CHANNEL                              │
│  Narrow passage. Fast current. You can      │
│  see an open stretch beyond the bend.       │
│  Smoke in the distance — could be a camp.   │
│                                             │
│  [Catarina]: "I've heard the right branch   │
│   gets shallow further on. Last dry season."│
│                                             │
│  [Take left channel]   [Take right channel] │
└─────────────────────────────────────────────┘
```

The information presented is:
- Visual description of each channel (drawn from the fork encounter template)
- Any intel the player has collected that's relevant to this fork
- Crew reaction (if any crew member has relevant knowledge or an opinion)

There is no "continue without choosing" — forks require a decision. The fork is the encounter.

---

## Random Encounter Trigger

During TRAVELING state, the system maintains a distance counter. At each abstract unit of travel:

```
encounterRoll = random(0, 1)
encounterThreshold = baseRate * segmentModifier * conditionModifiers
if encounterRoll < encounterThreshold:
    fire transit encounter
```

The fired encounter is selected from the current segment's transit encounter pool (see Encounter Template System). The pool is weighted — atmospheric encounters are common, genuine hazards are rare.

**One-time encounters**: Some transit encounters can only fire once per run (resource warning encounters, specific crew dialog). These are flagged `maxPerRun: 1` in the template and tracked in the run-local state.

**Cooldown**: After any encounter fires (shore hub or transit), a minimum distance cooldown prevents back-to-back interruptions.

---

## The Reference Map

The overhead map remains in the game but its role changes entirely. It is no longer a navigation tool. It is an archive.

The player opens it via a button on the HUD (journal-style, same location as the existing field journal button but expanded). It displays:

- The full geography of the player's world (the fixed map topology)
- The path this character has traveled, traced in a distinct color
- Shore hubs visited this run: marked with a distinct icon
- Shore hubs passed (player saw but didn't stop): marked differently (dimmer)
- Shore hubs not yet reached: visible as unnamed icons in the fog
- Fork choices made: the taken branch is traced, the other branch is visible but untraced
- The previous character's path: traced in a faded color (if any prior runs exist)
- Notable events from prior runs: small icons at nodes where significant things happened (deaths, missions completed, etc.)

The map does not show:
- The current mission objective location
- What encounters exist at unvisited nodes
- The names of unvisited nodes
- Any navigation options (clicking nodes does nothing)

The map is read-only. The player reads it like a log of what has happened, not a tool for deciding where to go.

---

## HUD During River Travel

The existing ResourceHUD is preserved and adapted for the river view:

- Resource bars remain visible during TRAVELING state
- Time of day / season / weather remain visible
- Crew names remain visible
- A small distance indicator or "days traveled" counter
- The reference map button (formerly "Journal")
- The field notes journal button (for naturalist specimen collection)

During STOPPED and INTERRUPTED states, the HUD may be partially hidden by the encounter panel, but resource bars should remain visible as context.

---

## Existing Systems That Feed Into This View

### Weather System (`GameState.ts`)
The weather state machine continues to run during TRAVELING. Visual changes to the river view (storm overlay, rain particles) respond to the current weather state. The existing weather transitions are unchanged.

### Time of Day (`GameState.ts`)
`advanceTime()` still fires after each node visit (shore hub stop). The visual sky and ambient light respond to time of day. Advancing time while traveling (not stopping) should advance time more slowly — traveling the river at night is possible but costly.

### AmbientSound System
The existing ambient sound system maps directly to the river view. River sounds, wildlife, weather — all driven by the same state machine. The scrolling view is its natural home.

### Crisis System (`CrisisManager.ts`)
Crisis checks still fire after node visits. The crisis visual treatment (existing dialog overlay) can remain unchanged or be adapted to interrupt the river view similarly to transit encounters.

---

## Relationship to Existing Code

### `RiverMap.ts` → Reference Map only
The existing `RiverMap.ts` handles drawing, interaction, fog of war, and weather overlays for the overhead map. Under the new architecture:
- All player interaction logic is removed (clicks don't navigate)
- The fog of war visualization remains (showing visited vs. unvisited nodes)
- The drawing system is extended to show the traced path and historical run paths
- It becomes the implementation of the reference map overlay

### `MapScene.ts` → River View Scene
The `MapScene.ts` becomes the host for the scrolling river view rather than the overhead map. It manages:
- The scrolling river renderer
- Movement state machine
- Shore hub approach detection and synopsis prompt
- Transition to encounter UI (currently this transitions to a separate EncounterScene — in the new architecture the encounter panel overlays the river view instead)
- The reference map overlay toggle

The existing scene transition logic (`scene.launch('EncounterScene')`) is replaced by an overlay system that keeps the river view loaded in the background.

---

## Open Design Decisions

1. **Phaser rendering approach for the scrolling view**: Options include (a) a parallax scrolling background layer system, (b) a pseudo-3D perspective projection using Phaser's camera and depth sorting, (c) a pre-rendered animation loop with sprite overlays. The original Amazon Trail used pre-rendered backgrounds — option (c) is closest to the reference but less dynamic. Option (a) is most buildable in Phaser 3.

2. **Encounter panel as overlay vs. scene transition**: Currently encounters load a separate Phaser scene (`EncounterScene`). Keeping them as overlays on the river view maintains visual continuity but requires the river view to stay "paused" in memory. Scene transitions are simpler architecturally. The overlay approach is preferred for immersion.

3. **Scroll speed and resource cost relationship**: Does travel speed affect resource consumption? Faster scrolling (pushing hard downriver) costs more fuel but covers more distance per real-time minute. This creates a pacing lever — do you burn fuel to outrun a storm, or run slow and conserve? Not essential for the initial implementation but worth designing for.

4. **Shore hub visibility range**: How far ahead does the player see an approaching hub? Too far and the choice feels unhurried; too close and it feels abrupt. Approximately 3–4 seconds of deceleration time feels appropriate. This is a tuning parameter.

5. **The boat's bow visual**: Does the player see their own boat in the view? The original Amazon Trail did not — it was purely forward perspective. A subtle bow railing at the bottom of the frame anchors the player without requiring a full boat model.
