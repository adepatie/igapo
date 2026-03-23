# Encounter Template System

## Purpose

The Encounter Template Library is the curated content of the game. Each template is a conditional document: it defines a situation, the authored text variants that can express it under different world states, the choices available to the player, and the effects those choices produce.

Templates are not fixed scripts. They are frameworks that the compilation pass selects from and adapts based on what the world remembers.

**Existing code:** `apps/web/src/data/encounterData.ts`, `apps/web/src/systems/EncounterEngine.ts`, `apps/web/src/data/encounterSelector.ts`

---

## Template Schema

```typescript
interface EncounterTemplate {
  id: string;                          // e.g. "village_arrival", "transit_caiman"
  type: EncounterTemplateType;
  arcLabel: string;                    // which story arc this belongs to (for content GUI)
  tags: EventTag[];                    // semantic tags, reused from Event Log taxonomy

  // Where and when this template can appear
  placement: PlacementRules;

  // World-state conditions required for this template to be a candidate
  preconditions: Precondition[];

  // Authored variants, each with their own conditions
  variants: EncounterVariant[];

  // What choices are available (may be modified by variant or crew injection)
  choices: EncounterChoice[];

  // Effects produced by each choice (written to Event Log)
  outcomeEffects: Record<string, WorldEffect[]>;
}

type EncounterTemplateType =
  | "shore_hub"           // player approached a bank node; movement pauses
  | "transit_random"      // interrupts river travel; Final Fantasy style
  | "river_fork"          // player reaches a fork; must choose branch
  | "transit_ambient"     // does not interrupt movement; flavor only (crew dialog, observations)
```

---

## Placement Rules

Placement rules determine which geography nodes and conditions make a template a valid candidate during the compilation pass.

```typescript
interface PlacementRules {
  nodeTypes?: GeographyNodeType[];   // which node types can host this
  hubSlotTypes?: HubSlotType[];      // which hub slot types (for shore_hub templates)
  regions?: Region[];                // which regions
  seasons?: Season[];                // null = any
  timeOfDay?: TimeOfDay[];           // null = any
  weather?: Weather[];               // null = any
  archetypes?: ArchetypeId[];        // null = any archetype can see this
  minRun?: number;                   // only appears after N total runs
  maxRun?: number;                   // only appears before N total runs
  segmentProperties?: {              // for transit_random templates
    widths?: SegmentWidth[];
    currentSpeeds?: SegmentCurrentSpeed[];
  };
}
```

---

## Preconditions

Preconditions are world-state queries against the derived state snapshot. A template only becomes a candidate if all its preconditions are satisfied.

```typescript
interface Precondition {
  query: PreconditionQuery;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "exists" | "not_exists";
  value: number | string | boolean;
}

type PreconditionQuery =
  | "node.community_trust"
  | "node.visit_count"
  | "node.last_archetype_visited"
  | "node.ecological_health"
  | "node.extraction_level"
  | "node.has_medical_history"
  | "region.outsider_disposition"
  | "region.recent_violence"
  | "region.ecological_pressure"
  | "world.total_runs"
  | "world.zona_silenciosa_fragments_found"
  | "run.archetype"
  | "run.crew_includes"             // checks if a specific crew member is aboard
  | "run.has_field_note"            // checks player's current field notes
  | "character.visited_node_before" // has the current character visited this node
```

### Example Preconditions

```typescript
// Only appears at a node that has been harmed before
{ query: "node.extraction_level", op: "gte", value: 3 }

// Only appears if the player is a medic
{ query: "run.archetype", op: "eq", value: "medic" }

// Only appears after the player has been to this node at least once before
{ query: "node.visit_count", op: "gte", value: 1 }

// Only appears if the region is wary of outsiders
{ query: "region.outsider_disposition", op: "lt", value: -2 }
```

---

## Encounter Variants

A template has one or more variants. The compilation pass evaluates variant conditions against the derived state snapshot and selects the first variant whose conditions are all satisfied. Variants are ordered from most specific (most conditions) to most general (fewest conditions).

```typescript
interface EncounterVariant {
  id: string;                        // e.g. "first_visit_neutral", "return_hostile"
  conditions: Precondition[];        // all must pass; empty = always valid (fallback)
  openingText: string;               // the descriptive text when the player approaches
  synopsis: string;                  // short text shown in the "stop or continue" prompt
  crewReactions?: CrewReaction[];    // conditional crew dialog on arrival
}

interface CrewReaction {
  crewMemberId: string;
  condition?: Precondition;          // optional: only if condition is met
  text: string;
}
```

### Example: village_arrival template variants

```typescript
variants: [
  {
    id: "return_hostile",
    conditions: [
      { query: "node.community_trust", op: "lt", value: -2 }
    ],
    openingText: "The dock is empty. No one comes to meet you. A child watches from behind a tree, then vanishes.",
    synopsis: "A settlement. Nobody at the dock.",
    crewReactions: [
      { crewMemberId: "catarina", text: "Something happened here. I don't know what, but they don't want us." }
    ]
  },
  {
    id: "return_friendly",
    conditions: [
      { query: "node.visit_count", op: "gte", value: 1 },
      { query: "node.community_trust", op: "gte", value: 2 }
    ],
    openingText: "A child on the bank recognizes the boat and runs toward the village shouting. By the time you've tied off, there are faces at every doorway.",
    synopsis: "A familiar settlement. Warm welcome.",
  },
  {
    id: "first_visit_neutral",
    conditions: [],   // fallback — always valid
    openingText: "Smoke rises from behind the treeline. A weathered dock extends into the water. Someone is watching you from the bank.",
    synopsis: "A settlement. Someone watching from shore.",
  }
]
```

---

## Choices

Choices are the actions the player can take at an encounter. They exist at the template level (not the variant level) but can be conditionally available based on world state, archetype, crew, or field notes.

```typescript
interface EncounterChoice {
  id: string;
  label: string;
  description?: string;              // longer explanation shown on hover
  successChance: number;             // 0.0–1.0 base; modified by BonusSystem
  requiresFieldNote?: string;        // field note ID required to unlock this choice
  requiresArchetype?: ArchetypeId;   // only available to this archetype
  requiresCrewMember?: string;       // only available if this crew member is aboard
  requiresPrecondition?: Precondition; // world-state gate
  isAlwaysAvailable?: boolean;       // cannot be hidden (e.g. "continue on")
}
```

### Injected Choices

The BonusSystem and EncounterEngine inject additional choices based on archetype and crew traits. This behavior is preserved from the existing system:

- **Dr. Melo** (crew): Injects "Observe with methodical patience" in wildlife encounters
- **Correspondent** (archetype): Injects "Press further" in human encounters
- **Medic** (archetype): Injects "Run clinic" in settlement encounters

These injections happen in the EncounterEngine at encounter presentation time, not in the template definition.

---

## Outcome Effects

Every choice maps to a set of `WorldEffect` entries that will be written to the Event Log when the choice is resolved.

```typescript
// In the template:
outcomeEffects: {
  "run_clinic": [
    { target: { type: "node", nodeId: "{{currentNodeId}}" }, attribute: "community_trust", delta: 2 },
    { target: { type: "node", nodeId: "{{currentNodeId}}" }, attribute: "has_medical_history", delta: 1 },
    { target: { type: "region", regionId: "{{currentRegion}}" }, attribute: "medic_reputation", delta: 1 }
  ],
  "take_supplies_only": [
    { target: { type: "node", nodeId: "{{currentNodeId}}" }, attribute: "community_trust", delta: -1 }
  ],
  "continue_on": []  // no world effects from passing through
}
```

Template variables (`{{currentNodeId}}`, `{{currentRegion}}`) are resolved at runtime by the EncounterEngine when writing to the Event Log.

---

## Transit Random Encounters

Transit random encounters use the same template format but differ in:
- `type: "transit_random"` instead of `"shore_hub"`
- `placement.segmentProperties` instead of `placement.hubSlotTypes`
- No `synopsis` field (there's no approach/stop decision — the encounter interrupts travel)
- Triggered by a probability roll during river travel, not by the compilation pass assignment

### Encounter Spectrum

Transit random encounters span a wide tonal range. Not all are dangerous:

| Category | Examples | Frequency |
|---|---|---|
| Atmospheric | Flock of macaws crossing, unusual water color, distant sound | Common |
| Crew interpersonal | Crewmate asks a question, shares a story, raises a concern | Common |
| Resource | Fuel getting low, food spoiling, equipment concern | Contextual (fires when resources below threshold) |
| Passive shore observation | Native waving from bank, smoke in distance, abandoned boat | Occasional |
| Navigation hazard | Submerged log, unexpected shallow, crossing vessel | Uncommon |
| Genuine danger | Storm, collision risk, hostile encounter | Rare |

### Probability Modification

Base probability per unit of travel distance, modified by conditions:

```typescript
const TRANSIT_ENCOUNTER_MODIFIERS = {
  night: 1.5,             // more encounters at night
  storm: 1.8,             // more encounters in storms
  igapo_region: 1.3,      // igapó is more unpredictable
  terra_firme: 0.8,       // upland river calmer
  wide_river: 0.7,        // less crowded, fewer events
  narrow_channel: 1.4,    // tight navigation = more hazards
}
```

Crew resource-alert encounters fire based on resource thresholds rather than probability rolls. They are one-time per resource per run (a crewmate won't repeatedly mention the same problem).

---

## River Fork Encounters

Fork encounters are a special transit type. They fire exactly once when the player's scrolling view reaches a fork node.

```typescript
interface ForkEncounter extends EncounterTemplate {
  type: "river_fork";
  leftBranch: ForkBranchDescription;
  rightBranch: ForkBranchDescription;
}

interface ForkBranchDescription {
  label: string;             // e.g. "Left channel — wider, slower"
  visualHint: string;        // what the player sees in the scrolling view
  intelHints?: string[];     // clues available if player has relevant knowledge
  crewComment?: CrewReaction; // crew member's opinion
}
```

The choice between branches is resolved exactly like any other encounter choice, but instead of producing resource effects, it sets the player's current branch in the run state, which the World Population Engine uses to determine which sub-manifest to load.

---

## Shore Hub vs. Transit Encounters — Behavioral Differences

| Aspect | Shore Hub | Transit Random |
|---|---|---|
| **Trigger** | Compiled into node by World Population Engine | Probability roll during movement |
| **Approach** | Player sees hub from distance, can choose to stop | Interrupts travel immediately |
| **Movement** | Pauses when player stops; resumes if they pass | Always pauses travel |
| **Options** | Always includes "Continue on" | Must resolve before travel resumes |
| **World effects** | Full outcome effects logged | Effects may be smaller or atmospheric |
| **Duration** | Can involve extended dialog/sub-exploration | Typically one exchange |

---

## Relationship to Existing Code

### `encounterData.ts` → Encounter Template Library
The existing encounters are flat structures with a single `arrivalText` and fixed choices. Migration path:
1. Each existing encounter becomes a template with a single `first_visit_neutral` variant
2. Additional variants are authored over time as the world state system is populated
3. The `encounterPool` weight system (currently on RiverNode) is replaced by preconditions on template variants

### `encounterSelector.ts` → absorbed into World Population Engine
The existing `encounterSelector.ts` filters a node's encounter pool by current conditions (season, time, weather). This logic moves into the compilation pass, which does the same filtering but also evaluates preconditions against derived world state.

### `EncounterEngine.ts` → extended
The EncounterEngine gains:
- Variant lookup (select the correct variant text for the current world state)
- Template variable resolution (substitute `{{currentNodeId}}` etc. in effect definitions)
- Fork encounter handling (present branch choice, resolve to run state)
- Transit encounter interruption (pause scrolling, present encounter, resume)

All existing archetype mechanic injection and crew reaction logic is preserved.

---

## Open Design Decisions

1. **How many variants per template?** The initial migration creates one variant per existing encounter. Full variant coverage (3–5 variants per template reflecting different world states) is a content authoring goal for the post-design phase.

2. **Success/failure variants**: Should a template have separate variants for the aftermath of a successful vs. failed choice? Currently, outcome text is in the EncounterEngine's `resolveOutcome` functions. These could be folded into the template as `outcomeVariants`, or kept separate. Separate is simpler initially.

3. **Ambient transit encounters**: The "does not interrupt movement" type (`transit_ambient`) is listed but not fully designed. These would be displayed as HUD overlays or crew dialog bubbles while the river scrolls. They need a separate UI treatment from paused encounters.

4. **Template versioning**: If a template is updated after players have event log entries referencing the old version, there's no conflict in the event log (it just stores the encounter ID). But the content management GUI should support tracking template revision history for authoring purposes.
