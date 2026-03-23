# Architecture Overview — Into the Várzea

## Purpose

This document defines the high-level architecture for the rearchitected game. It establishes the vocabulary and system boundaries used across all other design documents.

The game is being extended — not rebuilt. The existing Phaser 3 codebase (17 nodes, 50+ encounters, 4 archetypes, crew system, Codex meta-progression) provides the foundation. The new architecture layers persistent world memory and a scrolling river view on top of it.

---

## The Three Pillars

The game's systems are organized into three distinct layers that communicate in a single direction.

```
┌─────────────────────────────┐
│     GEOGRAPHY LAYER         │  Fixed. Generated once per player profile.
│  (the river that doesn't    │  The physical world: topology, regions,
│   change between runs)      │  segment properties, hub slot locations.
└──────────────┬──────────────┘
               │ read by
┌──────────────▼──────────────┐
│     EVENT LOG               │  Append-only. Grows every run.
│  (the Amazon's memory —     │  Records what happened, where, by whom,
│   every run, every death)   │  and what effect it had on the world.
└──────────────┬──────────────┘
               │ read by
┌──────────────▼──────────────┐
│  ENCOUNTER TEMPLATE LIBRARY │  Curated. Human-authored.
│  (conditional content that  │  Templates with variants that fire based
│   reflects what came before)│  on world state derived from the event log.
└─────────────────────────────┘
```

Data flows downward only during the compilation pass. During play, choices produce effects that are written back up to the Event Log. The Geography Layer is never written during play.

---

## The Run Lifecycle

Every run follows the same sequence:

### 1. Compilation Pass (run start)
The **World Population Engine** reads all three layers and produces a **run manifest** — a concrete map of encounters assigned to geography nodes, with the correct template variant pre-selected for each based on current world state. Random encounter tables are also generated for each river segment.

This happens before the player enters the river. The player sees only the telegram and the archetype selection screen while this runs.

### 2. Play
The player travels the river. The run manifest drives what they encounter. As choices are made, effects are written to the **run-local state cache** immediately — this allows later encounters in the same run to react to earlier choices (river gossip propagation).

### 3. Run End
One of three outcomes ends the run:
- **Mission success**: player reached and resolved the objective
- **Pull-out**: player ran out of a critical resource or chose to abort; character survives
- **Death**: character dies; permanent, no recovery

### 4. Log Write
All effects accumulated during the run are committed to the persistent Event Log. The run-local state cache is discarded. The world has changed.

### 5. Next Run
The compilation pass runs again against the updated Event Log. The world remembers.

---

## What "The Amazon Remembers" Means Technically

When a player's medic healed a village, an event entry was written to the log with effects on that node's `community_trust` attribute. When the next character (a different archetype, different player profile run) arrives at that same node, the compilation pass reads the derived trust value and selects an encounter variant that reflects a community with prior positive contact.

The player discovers this through the encounter text, not through a UI indicator. The world has memory; the player reads it through consequences.

The key mechanisms:
- **Derived state**: raw event log entries are aggregated into node/region attributes (trust, extraction level, ecological health, etc.)
- **Decay**: some attributes decay between runs (social trust fades); others do not (ecological damage persists)
- **Propagation**: effects at one node spread to adjacent nodes at reduced strength (river communities share information)
- **Variant selection**: encounter templates have multiple authored variants; the compilation pass selects the appropriate one based on derived state

---

## Character Persistence vs. World Persistence

These are separate concepts and should not be confused:

| | Character | World |
|---|---|---|
| **Survives death?** | No — game over | Yes — the Amazon persists |
| **Carries over?** | No — new archetype | Yes — same generated map |
| **Affected by choices?** | No — starts fresh | Yes — event log accumulates |

A player profile has one world. Characters come and go. The world outlives all of them.

**Crew** occupy a middle position: they are world entities (they exist in the geography between runs, at specific locations) but they have personal relationships with specific characters. Their availability for a new run depends on their status in the world and their relationship history with the character they're being asked to join.

---

## Relationship to Existing Code

| Existing System | Architecture Role | Status |
|---|---|---|
| `mapGenerator.ts` | Becomes the Geography Layer seeder | Extend |
| `packages/shared/src/types.ts` | RiverNode → GeographyNode schema | Extend |
| `Codex.ts` | Becomes the Event Log store + derivation layer | Extend |
| `encounterData.ts` | Becomes the Encounter Template Library | Extend |
| `encounterSelector.ts` | Absorbed into World Population Engine | Extend |
| `GameState.ts` | Extended to carry run manifest + derived state reads | Extend |
| `EncounterEngine.ts` | Extended to read template variants | Extend |
| `RiverMap.ts` | Becomes the reference-only map overlay | Replace primary role |
| `crew.ts` | Crew definitions gain persistence schema | Extend |
| `archetypes.ts` | Archetypes gain mission type definitions | Extend |

---

## What Changes vs. What Is Preserved

### Preserved
- All 50+ encounter content (migrated to template format)
- All 4 archetypes and their mechanics
- All 4 crew members and their traits/evolution
- Resource system (fuel, food, medicine, equipment, morale)
- Time/season/weather system
- Field notes and species documentation
- Meta-fragments (Zona Silenciosa arc)
- Crisis system (fuel, morale, equipment thresholds)

### Extended
- Codex gains Event Log capabilities (currently only tracks career stats)
- Encounters gain conditional variant system (currently use simple encounterPool weights)
- Crew gains cross-run persistence and relationship tracking
- Map generation becomes procedural with scale parameters

### Replaced
- Overhead click-map as primary navigation → replaced by scrolling river view
- Static 17-node map → procedurally generated map (same topology once generated)
- Node-to-node teleport movement → continuous scrolling movement with node approach

### New
- Event Log with derivation layer
- World Population Engine (compilation pass)
- Run manifest format
- Shore hub approach/stop mechanic
- River fork encounter type
- Final Fantasy-style random encounters during transit
- Telegram mission system
- Content management GUI (separate tool)

---

## Design Principles

**The world is the protagonist.** Individual characters are temporary. The Amazon persists.

**Discovery over disclosure.** World memory surfaces through encounter text, not UI indicators. Players read the world by traveling it.

**Curated content, procedural selection.** Encounter text is human-authored. The system selects which authored content is appropriate based on world state.

**Preserve and extend.** Every piece of existing content is an asset. New architecture migrates it forward, not away.

**Failure is narrative.** Pulling out, running out of fuel, dying — these are story beats, not cost screens. The world registers what happened.
