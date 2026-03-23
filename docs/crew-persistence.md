# Crew Persistence

## Purpose

Crew members are not run-local assets. They are persistent entities that exist in the world between runs, have histories with specific characters, and make decisions about whether to travel again based on what happened before. A crew member who watched your last character drown is not the same entity as one who has never shipped with you.

**Existing code:** `packages/shared/src/crew.ts`, `apps/web/src/systems/GameState.ts` (crew morale), `apps/web/src/systems/EncounterEngine.ts` (crew reactions, crew growth)

---

## Crew as World Entities

Crew members span all three layers of the architecture:

- **Geography Layer**: Between runs, a crew member is physically located somewhere in the world — a specific port, a settlement they know, or wherever they ended up after the last run.
- **Event Log**: Every interaction with crew generates entries. Deaths, morale changes, growth events, run starts and ends — all logged.
- **Encounter Templates**: Crew members appear as speaking characters in shore hub encounters. A crew member who survived your death might be found at a settlement, changed by the experience.

---

## Character Registry

The character registry lives in the Event Log's persistent store. It tracks all crew ever encountered, including their current state.

```typescript
interface CrewRecord {
  id: string;                          // stable cross-run ID, e.g. "crew_raimundo"
  name: string;
  role: string;
  currentStatus: CrewStatus;
  currentLocationNodeId: string | null; // where they are between runs
  traits: string[];                    // current traits (can evolve via growth system)
  relationshipHistory: CrewRelationshipEntry[];
}

type CrewStatus =
  | "available"         // can be recruited at their location
  | "at_sea"            // currently with a different run (shouldn't happen in single-player, but future-proof)
  | "unavailable"       // alive but not willing to work right now
  | "missing"           // whereabouts unknown after a traumatic run event
  | "deceased"          // dead, permanently removed from recruitment pool

interface CrewRelationshipEntry {
  runId: number;
  characterId: string;           // which player character they ran with
  archetypeId: ArchetypeId;
  trust_delta: number;           // net trust change over the run (+/-)
  morale_end: number;            // their morale at end of run
  notable_events: string[];      // encounter IDs of significant shared events
  run_outcome: "success" | "pullout" | "death";
}
```

---

## Derived Crew State

The derivation layer computes current crew relationship values from the full relationship history:

```typescript
interface DerivedCrewState {
  crewId: string;
  trust: number;                 // -10 to +10; aggregate across all runs with current character
  shared_experiences: string[];  // notable_events that appear in more than one run together
  last_run_outcome: "success" | "pullout" | "death" | "never_shipped";
  times_shipped_together: number;
  survived_death_together: boolean; // true if crew survived a run where the character died
}
```

Note: **trust is calculated per crew member relative to the current character's archetype**, not globally. A crew member who has had great runs with every medic but terrible runs with every correspondent will have high trust with a new medic character and low trust with a new correspondent.

This is derived by weighting relationship entries by archetype match:
- Same archetype as current: full weight
- Different archetype: 20% weight (reputation travels faintly)

---

## Run-Start Availability Check

Before the player enters the river, the World Population Engine checks which crew members are available. This happens in three stages:

### Stage 1: Status Filter
Only crew with `status: "available"` or `status: "missing"` are considered. Deceased and at-sea crew are excluded.

### Stage 2: Location Filter
Available crew must be at a location the player can reach at run start. For the initial implementation, this means crew at the starting port are always accessible. Crew at other locations require the player to detour to recruit them (a deliberate choice with resource cost).

### Stage 3: Relationship Resolution
Based on derived trust and the last run outcome, each available crew member gets a `joinCondition`:

```typescript
type JoinCondition =
  | { type: "gift"; item: string; text: string }  // trust >= 7: they have something for you
  | { type: "neutral"; text: string }              // trust 3–6: happy to sail
  | { type: "demand"; price: string; text: string } // trust 0–2: they want something first
  | { type: "refuse"; text: string }               // trust < 0: they won't go
  | { type: "never_shipped"; text: string }        // first time meeting
```

The join condition is surfaced as a brief scene when the player recruits crew at the start of a run — the equivalent of the existing crew assignment, but with narrative weight.

---

## Join Condition Examples

### Gift (high trust)
Raimundo has worked with your medic twice before and both runs went well. He's waiting at the dock with a fuel can he sourced somewhere.

> "Heard you were heading out again. I figured you'd need this. The Purus has been running low this season."

*Crew joins. Player receives: fuel +15.*

### Demand (low trust)
Catarina shipped with your last correspondent character and the run ended badly — you pulled out and left her to make her own way back. She'll go, but she has a condition.

> "I'll go back out there. But I'm not sleeping in the hold again. You get me a proper hammock from the market before we leave."

*Requires: spend medicine -10 (trade) or navigate to market district (costs time). If met, crew joins.*

### Refuse (very low trust / survived death)
Dr. Melo was on the boat when your last character drowned. He made it back. He is not going again with someone he doesn't know.

> "I watched the last one go into the river. I'm not ready. Maybe when I am, I'll find you."

*Crew unavailable this run. His status changes to `unavailable` for 1–2 runs before he becomes available again.*

---

## What Happens to Crew at Run End

### Character pulls out (mission failed, alive)
Crew members who were aboard come back with the character. Their `last_run_outcome` is `pullout`. Trust adjusts based on whether the pullout was orderly or chaotic (resource state at pullout time).

### Character dies
Crew who were aboard survive (or don't — there's a chance crew die in the same event that kills the character, based on the nature of the death). Survivors:
- Status changes to `available` at the nearest known settlement to the death location
- `last_run_outcome` set to `death`
- `survived_death_together` flag set to `true`
- Trust relationship is complex: surviving a death together can bond crew or traumatize them

### Crew left behind (player pulls out without them)
If the player abandons crew mid-run (edge case — possibly during a shore hub where crew went ashore and the player chose to leave), the crew member:
- Status: `available` at the node where they were left
- Trust delta: significant negative
- Their next encounter dialog reflects what happened

### Crew die during a run
Event log entry with `crew_lost` event type. Status permanently `deceased`. They may be referenced in future encounter dialog ("I knew someone who worked this stretch — they're gone now.").

---

## Crew as NPCs in Shore Hub Encounters

Crew members who are not currently with the player can appear as NPCs at shore hubs. This is managed by the World Population Engine during the compilation pass:

- The compilation pass checks crew status and location against the geography node for each hub encounter
- If a crew member is `available` at that location, a crew-encounter template can fire
- The EncounterEngine checks the run's current crew manifest to prevent crew aboard from appearing at shore hubs

These crew-as-NPC encounters are how the player finds and recruits crew who aren't at the starting port. They're authored as shore hub encounter templates with the crew member's `id` in a `crewPresent` field.

---

## Crew Growth: Preserved System

The existing crew growth system (evolving traits through encounter experiences) is fully preserved. Growth events are logged as `WorldEvent` entries and the evolved trait is written to the `CrewRecord` in the character registry.

Evolved traits persist across runs — Raimundo who became "Storm-Tested" in run 3 is still Storm-Tested in run 6. This is part of what makes long-running crew relationships feel meaningful.

---

## Relationship to Existing Code

### `packages/shared/src/crew.ts`
The four existing crew definitions (Solange, Dr. Melo, Raimundo, Catarina) become the initial entries in the character registry. Their trait definitions are preserved. The `CrewMember` type gains `currentStatus`, `currentLocationNodeId`, and `relationshipHistory` fields.

### `GameState.ts` — crew morale
Per-run morale tracking is preserved. At run end, the final morale value is written to the `CrewRelationshipEntry` as `morale_end`.

### `EncounterEngine.ts` — crew reactions and growth
Both systems are preserved. Crew growth events now also write to the `CrewRecord` in the persistent registry, not just the run-local state.

---

## Open Design Decisions

1. **Trust decay between runs**: Should trust decay if the crew and character don't ship together? Currently trust is calculated from the history of runs together. If a character does 5 runs without Raimundo, does his trust "reset" toward neutral? Could feel punishing, but also realistic.

2. **New crew introduction**: The current pool is 4 crew members. New crew members introduced through shore hub encounters need a "first contact" template that brings them into the character registry. The template creates the CrewRecord on first encounter.

3. **Crew death probability**: When a character dies, what's the chance each crew member also dies? A simple implementation: crew survive unless the death event has a "catastrophic" flag (e.g., boat sinks vs. character falls overboard). A more complex implementation ties crew survival to their skill traits and the nature of the crisis.

4. **Multiple characters, same crew**: Since the player can play different archetypes, Raimundo may have shipped with a medic, a naturalist, and a correspondent across different runs. How do these relationships interact? The archetype-weighted trust formula handles this, but the narrative display (in the join condition scene) needs to decide which history to reference — probably the most recent relevant run.
