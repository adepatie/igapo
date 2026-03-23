# Event Log — World Memory

## Purpose

The Event Log is the Amazon's memory. It is an append-only record of everything that has happened in this world — across every run, every character, every death. It never shrinks. Each new run adds to it.

The Event Log is the source of truth for world state. When the compilation pass asks "what has happened at this node?" or "how do the locals feel about outsiders in this region?", it queries the Event Log (via the Derivation Layer) to find out.

**Existing code:** `apps/web/src/systems/Codex.ts`

---

## Design Principles

**Append-only.** Events are never modified or deleted. History is permanent. This simplifies consistency: if something happened, it happened.

**Dumb storage, smart derivation.** The log stores raw facts. It does not compute trust scores or ecological health — those are derived by a separate pass. This keeps the log simple and the derivation logic centralized.

**Tagged for fast querying.** Every event carries semantic tags that allow the derivation layer to filter events without parsing the full payload.

---

## Event Entry Schema

```typescript
interface WorldEvent {
  // Identity
  id: string;                  // unique event ID, e.g. "evt_00342"
  runId: number;               // which run this occurred in
  turn: number;                // which move/turn within the run

  // Location
  nodeId: string;              // geography node ID where this occurred
  regionId: Region;            // region for faster regional queries

  // Actor
  characterId: string;         // the player character (archetype instance ID)
  archetypeId: ArchetypeId;    // the archetype played this run

  // Event
  eventType: WorldEventType;
  encounterId?: string;        // which encounter template fired (if encounter-based)
  choiceId?: string;           // which choice the player made
  outcome: "success" | "failure" | "neutral" | "aborted";

  // Effects produced by this event (applied to world state)
  effects: WorldEffect[];

  // Tags for fast filtering
  tags: EventTag[];
}

type WorldEventType =
  | "encounter_outcome"        // player resolved an encounter
  | "transit_encounter"        // random encounter during river travel
  | "node_visited"             // player arrived at a node (even if no encounter)
  | "node_passed"              // player saw a node but did not stop
  | "run_start"                // character began a run
  | "run_end_success"          // mission completed
  | "run_end_pullout"          // character pulled out (alive, mission failed)
  | "run_end_death"            // character died
  | "crew_joined"              // crew member joined this run
  | "crew_lost"                // crew member died or was left behind
  | "mission_objective_reached"// player found the mission objective node
```

---

## Effect Schema

Effects are the world-state mutations that an event produces. They target either a specific node, a region, or a character (crew member or NPC).

```typescript
interface WorldEffect {
  target: EffectTarget;
  attribute: string;       // the world state attribute being changed
  delta: number;           // positive or negative change
  note?: string;           // human-readable description for the content management GUI
}

type EffectTarget =
  | { type: "node"; nodeId: string }
  | { type: "region"; regionId: Region }
  | { type: "character"; characterId: string }
  | { type: "world" }      // global attributes (rare)
```

### Example Event Entry

```typescript
{
  id: "evt_00342",
  runId: 4,
  turn: 87,
  nodeId: "node_112",
  regionId: "varzea",
  characterId: "char_elena_voss_run4",
  archetypeId: "medic",
  eventType: "encounter_outcome",
  encounterId: "village_medical_aid",
  choiceId: "run_clinic",
  outcome: "success",
  effects: [
    { target: { type: "node", nodeId: "node_112" }, attribute: "community_trust", delta: 2, note: "Village received medical care" },
    { target: { type: "region", regionId: "varzea" }, attribute: "medic_reputation", delta: 1, note: "Word spreads along the river" },
    { target: { type: "character", characterId: "crew_raimundo" }, attribute: "morale", delta: 5 }
  ],
  tags: ["human", "medical", "positive_community", "settlement"]
}
```

---

## Tag Taxonomy

Tags are semantic labels used by the derivation layer for fast event filtering. An event can have multiple tags.

```typescript
type EventTag =
  // Encounter domain
  | "human"           // involved human interaction
  | "wildlife"        // involved wildlife
  | "navigation"      // involved river navigation
  | "discovery"       // involved finding something
  | "story"           // involved meta-narrative content

  // Valence
  | "positive_community"   // improved relations with locals
  | "negative_community"   // harmed relations with locals
  | "ecological_harm"      // damaged the environment
  | "ecological_benefit"   // helped the environment
  | "medical"              // involved healthcare
  | "violent"              // involved conflict

  // Context
  | "settlement"       // occurred at or near a settlement
  | "wilderness"       // occurred in uninhabited territory
  | "night"            // occurred at night
  | "storm"            // occurred during a storm
  | "wet_season"       // occurred during wet season
  | "dry_season"       // occurred during dry season

  // Run outcome
  | "mission_success"
  | "mission_failure"
  | "character_death"
```

---

## The Derivation Layer

The derivation layer computes derived world state from raw event entries. It runs once at the start of each compilation pass and produces a **derived state snapshot** — a flat dictionary of node and region attributes — that the encounter templates query.

The derivation layer is not real-time. It is a batch computation at run-start. This keeps it simple and fast.

### Node Attributes (derived per node)

```typescript
interface DerivedNodeState {
  nodeId: string;
  community_trust: number;          // -10 to +10; how locals feel about outsiders
  visit_count: number;              // how many times this node has been visited across all runs
  last_archetype_visited: ArchetypeId | null;  // which archetype last stopped here
  last_run_visited: number | null;  // which run last visited
  ecological_health: number;        // 0–10; habitat quality
  extraction_level: number;         // 0–10; cumulative resource extraction
  has_medical_history: boolean;     // was medical aid provided here
  is_mission_objective_history: boolean;  // was this a mission objective in a prior run
  notable_events: string[];         // encounter IDs of notable past events, for dialog references
}
```

### Region Attributes (derived per region)

```typescript
interface DerivedRegionState {
  regionId: Region;
  outsider_disposition: number;     // -5 to +5; aggregate regional attitude
  medic_reputation: number;         // -3 to +3; reputation of doctors
  ecological_pressure: number;      // 0–10; cumulative environmental harm
  recent_violence: boolean;         // was there violence here in the last 2 runs
  dominant_archetype_history: ArchetypeId | null;  // most common archetype to pass through
}
```

### Global Attributes

```typescript
interface DerivedWorldState {
  total_runs: number;
  total_characters_died: number;
  total_missions_completed: number;
  total_missions_failed: number;
  zona_silenciosa_fragments_found: number;  // existing meta-narrative arc
}
```

---

## Derivation Functions

Each attribute has a derivation function that processes filtered event entries. These functions encode the "rules of how the world evolves."

### Example: community_trust at a node

```
community_trust(nodeId) =
  SUM of all effect deltas where:
    target.type = "node" AND
    target.nodeId = nodeId AND
    attribute = "community_trust"
  THEN apply decay: multiply by (0.8 ^ runs_since_last_visit)
  CLAMP to [-10, +10]
```

### Example: ecological_harm (does not decay)

```
extraction_level(nodeId) =
  SUM of all effect deltas where:
    target.type = "node" AND
    target.nodeId = nodeId AND
    attribute = "extraction_level"
  NO DECAY
  CLAMP to [0, 10]
```

### Decay Philosophy

| Attribute | Decay Rate | Rationale |
|---|---|---|
| `community_trust` | 20% per run | Relationships fade without maintenance |
| `outsider_disposition` | 10% per run | Regional reputation fades slowly |
| `ecological_health` | Regenerates +0.5/run if no harm | Nature recovers slowly |
| `extraction_level` | No decay | Extraction damage is permanent |
| `recent_violence` | Resets after 2 runs | Violence memory is specific and fades |
| `medic_reputation` | 15% per run | Medical reputation is earned and fades |

### Propagation

Some events at a node propagate effects to adjacent nodes and their region, at reduced strength. This models information spreading along the river.

```typescript
const PROPAGATION_RULES = {
  community_trust: {
    adjacentNodes: 0.3,    // 30% of the delta reaches adjacent nodes
    region: 0.1,           // 10% reaches the regional outsider_disposition
  },
  ecological_harm: {
    adjacentNodes: 0.5,    // Ecological damage spreads significantly
    region: 0.2,
  },
  medical: {
    region: 0.2,           // Medical aid improves regional medic_reputation
  }
}
```

---

## What Gets Logged vs. What's Ephemeral

### Always logged (writes a WorldEvent)
- Player makes a choice in an encounter (any encounter type)
- Player visits a node (even if they just pass through)
- Player passes a hub node without stopping
- Crew member joins or is lost
- Run starts or ends (with outcome)

### Not logged (ephemeral, exists only within a run)
- Individual resource drain events (fuel -10 per move) — only the net run totals are logged
- Hover/tooltip interactions
- HUD state changes
- Within-encounter UI navigation (scrolling text, re-reading choices)

---

## Relationship to Existing `Codex.ts`

The existing `Codex.ts` already provides persistence across runs via localStorage. It tracks:
- `allNoteIds`, `visitedNodeIds`, `metaFragments`
- `totalRuns`, career stats per archetype
- Fragment triggers

Under the new architecture, `Codex.ts` becomes the host for the Event Log store. The existing career stats become derived attributes in the derivation layer. The existing `visitedNodeIds` becomes derivable from `node_visited` events.

The `recordRun()` method evolves into the log-write step at run end, committing accumulated effects from the run-local state cache.

The localStorage key `varzea_codex_v1` should be versioned up (`varzea_world_v2` or similar) when the new schema is adopted, with a migration path from the old format.

---

## Open Design Decisions

1. **Storage size**: LocalStorage has a ~5–10MB limit. A large event log across many runs could approach this. Options: (a) truncate old events beyond a certain run count while preserving derived state snapshots, (b) migrate to IndexedDB for larger storage.

2. **Derived state caching**: Should the derived state snapshot be cached between sessions, or recomputed at every run start? Caching is faster but requires invalidation logic when old events are trimmed. Recomputing is simple and correct.

3. **Granularity of effect logging**: The schema above logs effects at the encounter choice level. Should individual resource drain during transit also be logged? Currently excluded as "ephemeral" — this could be revisited if per-segment history becomes useful.

4. **Cross-run character references**: A crew member who died in run 3 may be referenced in run 7's encounter dialog. The event log preserves this permanently — but encounter templates need to query it correctly to avoid referencing living characters as dead and vice versa.
