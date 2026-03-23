# Geography Layer

## Purpose

The Geography Layer is the physical skeleton of the Amazon world. It is generated once per player profile and never changes between runs. It defines where things can be — not what is there. Content (encounters, NPCs, states) lives in the Event Log and Encounter Template Library.

**Existing code:** `apps/web/src/data/mapGenerator.ts`, `packages/shared/src/types.ts`

---

## Core Concept: Topology Without Content

A node in the Geography Layer does not know what encounter will appear there. It knows:
- Where it is (position on the river)
- What kind of place it is (a shore that could hold a settlement, a fork in the river, open water)
- What region it belongs to
- What properties govern transit through it (current speed, hazard baseline)

This separation is what allows the world to change between runs while the geography stays fixed.

---

## Node Schema

```typescript
interface GeographyNode {
  id: string;                    // stable across runs, e.g. "node_047"
  position: { x: number; y: number };  // map coordinates
  type: GeographyNodeType;
  region: Region;
  hubSlot?: HubSlotType;         // present only if this node can host a shore hub
  isFork: boolean;               // true if this node is a river fork point
  segmentIds: string[];          // edges connecting to this node
}

type GeographyNodeType =
  | "open_water"        // no shore hub possible, transit only
  | "bank"              // shore hub slot possible
  | "fork"              // river divides here, player chooses branch
  | "confluence"        // two branches rejoin (no choice)
  | "port"              // always has a hub (start/end towns)

type HubSlotType =
  | "settlement_viable"   // could be village, camp, mission
  | "wildlife_viable"     // could be wildlife observation point
  | "navigation_viable"   // could be a tricky passage, sandbar, rapids
  | "discovery_viable"    // could be ruins, unusual phenomena
  | "story_viable"        // reserved for mission-critical or meta-narrative
```

---

## Segment Schema

Segments are the river stretches between nodes. They govern transit: how long it takes, what random encounter table applies, what the hazard baseline is.

```typescript
interface RiverSegment {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  length: number;             // abstract units, translates to fuel cost and scroll duration
  width: "narrow" | "medium" | "wide" | "braided";
  currentSpeed: "slow" | "moderate" | "fast" | "turbulent";
  hazardBaseline: number;     // 0.0–1.0, base random encounter probability per unit length
  region: Region;
  branchId?: string;          // present if this segment is part of a fork branch
}
```

---

## Region Definitions

Regions affect encounter pools, ambient visuals, and seasonal behavior.

```typescript
type Region =
  | "varzea"        // floodplain; seasonal flooding; várzea forest; high human activity
  | "igapo"         // permanently flooded forest; dark water; fewer settlements
  | "terra_firme"   // upland; drier; different species mix; longer between shore hubs
  | "upper_river"   // narrower tributaries; less navigable; more remote
  | "confluence"    // where major tributaries join; high activity, complex currents

interface RegionProperties {
  id: Region;
  hubDensity: number;          // average distance between hub slots (abstract units)
  hazardModifier: number;      // multiplier on segment hazardBaseline
  randomEncounterPool: string; // which encounter table applies during transit
  seasonalEffect: {
    wet: { floodLevel: "low" | "medium" | "high"; note: string };
    dry: { floodLevel: "low" | "medium" | "high"; note: string };
  };
}
```

---

## Map Generation Rules

The map is generated once and stored in the player profile. The same seed produces the same map. The generation process:

### Scale Parameters
```typescript
interface MapGenerationConfig {
  totalLength: number;          // total river length in abstract units (very large)
  forkFrequency: number;        // average distance between fork nodes
  forkReunionDistance: number;  // how far branches run before potentially rejoining
  hubSlotDensity: number;       // average distance between hub slots on a branch
  portCount: number;            // number of guaranteed town/port nodes
  regionSequence: Region[];     // rough order of regions from start to deep river
}
```

### Generation Steps
1. **Spine generation**: Place the main river channel as a series of segments and nodes from start to the "deep river" (the journey never truly ends — the river extends beyond any single run's reach).
2. **Fork injection**: At intervals defined by `forkFrequency`, insert fork nodes. Each fork spawns two branches that run in parallel for `forkReunionDistance` before potentially rejoining or diverging permanently.
3. **Hub slot placement**: Along each branch, place hub slots at intervals defined by `hubSlotDensity`. Hub slot type is determined by region and random seed.
4. **Port placement**: Guarantee a starting port node and distribute other port nodes at major river junctions.
5. **Region assignment**: Assign regions to segments and nodes based on distance from start and branch depth.

### What Makes the Map Feel Endless
The map extends far beyond what any single run can reach. The player never hits a "wall" — the river always continues. Mission objectives are seeded at distances the player can realistically reach in a run, but the river extends past them.

---

## Fork Node Behavior

Fork nodes are a special case. They don't have hub slots. They represent the physical division of the river.

```typescript
interface ForkNode extends GeographyNode {
  type: "fork";
  isFork: true;
  leftBranchId: string;    // segment ID for left channel
  rightBranchId: string;   // segment ID for right channel
  forkGroupId: string;     // links this fork to its eventual confluence node (if any)
}
```

When the World Population Engine processes a fork node, it generates a fork encounter — a template type that presents the player with the two channels and any available information about each branch.

---

## Relationship to Existing Code

### `mapGenerator.ts` → Geography Layer seeder
The existing `mapGenerator.ts` produces a static 17-node graph. Under the new architecture, it becomes the geography seeder: it generates a large procedural graph using the parameters above and stores it in the player profile (via the persistent store, alongside the Event Log).

The existing node types (`town`, `settlement`, `wildlife`, `discovery`, `navigation`, `story`) map to the new `HubSlotType` values:
- `town` → `port`
- `settlement` → `settlement_viable`
- `wildlife` → `wildlife_viable`
- `discovery` → `discovery_viable`
- `navigation` → `navigation_viable`
- `story` → `story_viable`

The existing 17-node map can serve as the initial "tutorial" geography for the first few runs, with procedural generation unlocked after the player has completed at least one run.

### `packages/shared/src/types.ts` → RiverNode
The existing `RiverNode` interface merges geography and encounter content. Under the new architecture these are separated: `GeographyNode` holds only physical properties; encounter assignment is the compilation pass's responsibility.

---

## What Changes Rarely

The Geography Layer is designed to be read-only after generation, but a small set of long-term world events could modify it:

- **Landslide/dam**: a segment becomes impassable (blocked flag on the segment)
- **New settlement grows**: a `bank` node gains a `settlement_viable` hub slot where it had none
- **Port abandonment**: a `port` node degrades to `bank`

These are intentionally rare and should only happen as the result of major accumulated world state changes over many runs. They are not expected in the initial implementation.

---

## Open Design Decisions

1. **How large is the map?** The abstract "length" units need to be calibrated against run duration. A run should cover roughly 30–50% of the traversable river before resource pressure becomes relevant.

2. **Are fork branches ever permanently cut off?** If a fork branch has a permanently blocked segment, the geography has truly diverged for that player's world. This is dramatic but one-way. Defer this for post-launch.

3. **First run geography**: Should the first run use the existing 17-node static map as a tutorial geography, or should procedural generation apply from run 1? The tutorial map has well-tested content; procedural generation needs the encounter template library to be fully populated before it feels good.

4. **Seed storage**: Where does the map seed live? It needs to be part of the player profile, persistent across sessions. Currently `Codex.ts` uses localStorage — the geography seed would live alongside the event log in the same store.
