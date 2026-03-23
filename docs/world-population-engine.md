# World Population Engine

## Purpose

The World Population Engine is the bridge between history and the present run. It reads the Geography Layer and the Event Log's derived state, evaluates the Encounter Template Library, and produces a **run manifest** — the concrete encounter assignment for this specific run that reflects everything that has come before.

It runs once at run start (and incrementally as the player approaches uncompiled nodes). The player never sees it work. They only see its output: a world that remembers them.

**Existing code:** No direct equivalent. `encounterSelector.ts` performs a subset of this logic (filtering by time/season/weather). `Codex.recordRun()` performs the inverse (writing run results to persistent store).

---

## Conceptual Role

```
Geography Layer        ──┐
Event Log (derived state)──┼──▶  World Population Engine  ──▶  Run Manifest
Encounter Template Library──┘
Player Character State ──┘
```

The run manifest is what the river view actually reads. It is not generated on-the-fly during play — it is pre-computed, at least for the nodes within the rolling compilation window ahead of the player.

---

## Inputs

```typescript
interface CompilationInput {
  geography: GeographySnapshot;       // all nodes and segments for this player's world
  derivedState: DerivedStateSnapshot; // derived from event log: node attrs, region attrs, world attrs
  templateLibrary: EncounterTemplate[]; // all authored encounter templates
  character: PlayerCharacterState;    // current run's archetype, starting resources, run count
  missionObjective: MissionObjective; // seeded objective for this run
  runId: number;
}

interface PlayerCharacterState {
  archetypeId: ArchetypeId;
  runCount: number;         // total runs this player profile has completed
  currentRunNumber: number;
  crewManifest: string[];   // crew member IDs joining this run
}
```

---

## Output: The Run Manifest

```typescript
interface RunManifest {
  runId: number;
  nodeManifest: NodeAssignment[];     // encounter assigned to each compiled node
  segmentManifest: SegmentAssignment[]; // random encounter table for each segment
  missionObjectiveNodeId: string;     // which node holds the mission objective (hidden from player)
  intelNodeIds: string[];             // nodes that carry intel hints toward the objective
  forkManifests: Record<string, RunManifest>; // sub-manifests for each fork branch (compiled lazily)
}

interface NodeAssignment {
  nodeId: string;
  assignedTemplateId: string;         // which template was selected
  assignedVariantId: string;          // which variant was selected
  isCompiled: boolean;                // false if this node hasn't entered the rolling window yet
  isMissionObjective: boolean;        // hidden flag for EncounterEngine
  hasIntelHint: boolean;              // should this node inject an intel hint into its encounter
  intelHintText?: string;             // the specific hint text if hasIntelHint is true
}

interface SegmentAssignment {
  segmentId: string;
  encounterTable: WeightedEncounterEntry[];  // transit random encounter pool for this segment
  baseEncounterRate: number;           // rolls per abstract unit of travel
}

interface WeightedEncounterEntry {
  templateId: string;
  weight: number;
  maxPerRun?: number;    // cap for one-time or limited encounters
}
```

---

## Compilation Steps

### Step 1: Derive World State Snapshot
Run all derivation functions against the raw event log. Produce the `DerivedStateSnapshot`. This is the authoritative picture of the world's current state, pre-computed once for efficiency.

### Step 2: Seed Mission Objective
Select an objective node:
- Filter nodes by mission type requirements (e.g., `settlement_viable` for sick village)
- Filter by reachability: must be reachable within a resource-reasonable run length from the start
- Filter by world state: don't seed a "sick village" mission at a node that was just resolved as healthy
- Weight toward nodes not recently visited (more discovery, less repetition)

Seed 2–4 intel nodes along plausible paths toward the objective. Generate hint texts using the mission type and objective node's geography properties.

### Step 3: Compile the Rolling Window
For each node within the initial rolling window (the first N nodes reachable from the start port):

#### 3a. Candidate Selection
Filter the template library to candidates valid for this node:
- `placement.nodeTypes` includes this node's type
- `placement.hubSlotTypes` includes this node's hub slot type
- `placement.regions` includes this node's region
- `placement.archetypes` includes the current archetype (or is null)
- `placement.minRun` ≤ current run count
- `placement.maxRun` ≥ current run count (if set)

#### 3b. Precondition Evaluation
For each candidate, evaluate all `preconditions` against the derived state snapshot for this specific node and region. Discard candidates that fail any precondition.

#### 3c. Coherence Checking
Remove candidates that would produce contradictions:
- Encounters referencing crew members who are currently aboard (they can't also appear at this shore hub)
- Encounters referencing deceased characters as if living
- Encounters with incompatible assumptions about node state (e.g., two candidates that both assume they are "the first encounter here")

#### 3d. Variant Selection
For each surviving candidate, evaluate its variants. Select the first variant (most specific to least specific) whose all conditions pass. Discard candidates with no valid variant.

#### 3e. Weighting and Selection
The remaining candidates are weighted. Weight is determined by:
- Template-level `baseWeight` (some encounters are inherently more frequent)
- World state amplification: candidates whose preconditions indicate a "close match" to the current state get higher weight
- Variety: templates not seen recently in this run are upweighted (avoid repetition)

One template is selected. Its winning variant is recorded. The assignment is written to the manifest.

#### 3f. Mission Objective Injection
If this node is the mission objective node, the selected template is replaced with (or augmented by) the mission objective encounter. Intel hint text is injected into the encounter variant's content.

### Step 4: Compile Segment Tables
For each river segment within the rolling window:
- Filter transit random encounter templates by `placement.segmentProperties` (width, current speed)
- Filter by region and current conditions
- Apply hazard baseline from the segment's geography properties
- Build the weighted table

### Step 5: Fork Pre-Compilation
Fork nodes within the rolling window get stubs in `forkManifests`. The sub-manifests for each branch are not compiled until the player approaches the fork (lazy compilation). This ensures that same-run choices propagated to the run-local cache can influence branch compilation.

---

## Lazy Compilation: The Rolling Window

The rolling window ensures same-run propagation works correctly. The window extends N nodes ahead of the player's current position (N ≈ 5–8 nodes, configurable). As the player moves forward, new nodes enter the window and are compiled immediately.

```
Player position: node 12
Rolling window: nodes 12–20 are compiled
Node 21: not yet compiled

Player makes a major choice at node 14 → run-local cache updated
Player reaches node 16 → node 21 enters window → compiled with node 14's effect visible
```

This means a significant event early in a run can influence encounters later in the same run, without the entire run being pre-compiled in a single batch.

---

## Same-Run Propagation

The run-local state cache is separate from the event log (which is only written at run end). It holds:

```typescript
interface RunLocalCache {
  runId: number;
  nodeVisits: string[];          // nodes visited so far this run
  choicesMade: Record<string, string>;  // nodeId → choiceId
  effectsAccumulated: WorldEffect[];    // effects produced so far this run
  derivedDelta: Partial<DerivedStateSnapshot>; // fast-lookup delta to apply over base derived state
}
```

When the rolling window compiles a new node, it applies the `derivedDelta` on top of the base derived state snapshot. This means if the player helped a village upstream, the downstream encounter reads the trust value that includes that help.

The `derivedDelta` is intentionally limited in scope — it only propagates effects that were tagged with `"propagates_same_run": true` in the effect definition. Not every effect propagates within the same run; only those that would realistically spread (river gossip, crew reactions, regional reputation).

---

## Branch Handling at Forks

When the player reaches a fork and chooses a branch, the fork sub-manifest for that branch is compiled immediately. The sub-manifest compilation uses:
- The base derived state snapshot (same as the main manifest)
- The current run-local cache (including choices made before the fork)
- The branch's specific geography nodes and segments

The unchosen branch's sub-manifest is discarded (or not compiled at all). The player cannot "undo" a fork choice. The unchosen branch remains visible on the reference map as an untraced path — the player knows it exists but not what's on it.

---

## Crew Availability Processing (pre-run)

Before the main compilation, the engine processes crew availability:

1. Load all `CrewRecord` entries from the character registry
2. Filter to `status: "available"` or `status: "missing"`
3. For each available crew: calculate join condition based on derived relationship state
4. Identify which crew are at the starting port vs. at other locations
5. Present starting port crew to the player during the pre-run setup screen
6. Mark other-location crew in the manifest: their location node gets a crew encounter template injected

---

## Relationship to Existing Code

### `encounterSelector.ts`
The existing `encounterSelector.ts` does a subset of Step 3a/3b: it filters an encounter pool by time of day, season, weather, and minimum run count. The World Population Engine extends this logic to include full precondition evaluation against derived world state. The existing selector can be absorbed into the compilation pass or kept as a utility function it calls.

### `Codex.ts` — `recordRun()`
The `recordRun()` method currently writes career stats to localStorage at run end. It evolves into the event log write step: converting the accumulated `runLocalCache.effectsAccumulated` into formal `WorldEvent` entries and appending them to the persistent log.

### `GameState.ts`
GameState gains a reference to the run manifest. Instead of the current pattern of "visit node → look up encounter in ENCOUNTERS map," it becomes "visit node → look up the pre-compiled assignment in the run manifest." The manifest's `NodeAssignment` is the source of truth for what encounter fires.

---

## Open Design Decisions

1. **Rolling window size**: Too small and same-run propagation feels limited. Too large and the compilation pass at run start is expensive. N = 5–8 nodes ahead is a reasonable starting range.

2. **When to run the initial compilation**: The compilation takes time (filtering, evaluation, weighting across hundreds of templates). It should run during the pre-run setup screen (archetype selection + telegram reveal) so the player never waits for it. If the library grows large, a loading indicator may be needed.

3. **Manifest persistence**: Should the run manifest be saved to localStorage? If the player closes the game mid-run, should the same manifest be restored? Yes — the manifest should persist with the run state so returning to a saved run produces the exact same encounter sequence.

4. **Template selection determinism**: The compilation pass uses weighted random selection. This should be seeded from the run ID so that saving and restoring produces identical results (no "reload fishing" for different encounter assignments).

5. **Mission objective fallback**: If no node passes all the filters for the mission objective (extremely unlikely but possible if the world state is unusual), the engine should log a warning and relax the least critical filter until a valid node is found.
