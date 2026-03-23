# Mission System

## Purpose

Every run begins with a telegram. It tells the player why they are on the river — what they are looking for, who sent them, what is at stake. The mission gives the endless river a specific shape for this run. Not a map marker. Not a waypoint. A reason.

The player does not know where their objective is. They travel until the river gives them enough information to find it, or until they can no longer continue.

**Existing code:** `packages/shared/src/archetypes.ts`, `apps/web/src/scenes/ArchetypeScene.ts`, `apps/web/src/scenes/RunEndScene.ts`

---

## The Telegram

At run start, after archetype selection, the player receives a telegram. It is brief, in-world, and archetype-specific. It establishes:

- Who sent it and why they're reaching out to this particular person
- What the objective is (general: a sick village, a specific specimen, a source for a story)
- Any context the character would have going in (prior knowledge, rumors, partial location intel)

The telegram is the only explicit mission framing the player receives. Everything after is discovered through play.

### Telegram Templates (per archetype)

Each archetype has a pool of telegram templates. The World Population Engine selects one per run based on:
- Which telegrams have been used in prior runs (no immediate repeats)
- World state (a region with high ecological pressure gets a different naturalist mission than a pristine one)
- Run history (after a failed mission of the same type, the telegram may acknowledge it obliquely)

```typescript
interface TelegramTemplate {
  id: string;
  archetypeId: ArchetypeId;
  sender: string;             // who sent it (organization, contact, institution)
  subject: string;            // the mission objective type
  bodyText: string;           // the telegram text (authored, in-world voice)
  missionType: MissionType;
  worldStateConditions?: Precondition[];  // optional conditions for this telegram to be selected
  historicalReferences?: HistoricalReference[];  // places to insert prior run callbacks
}

interface HistoricalReference {
  insertionPoint: string;     // placeholder in bodyText, e.g. "{{prior_failure_note}}"
  condition: Precondition;    // if this world state is true
  text: string;               // the text inserted if condition is met
}
```

### Example Telegrams

**Medic — sick village**
```
FROM: Fundação Saúde do Rio, Manaus
TO: Dr. [Name]

We have reports of a respiratory illness spreading through settlements on the upper tributaries,
possibly waterborne. Two communities have already stopped responding to radio contact.

You are the closest qualified physician willing to go in. Supplies are being arranged at Porto
Alegre do Rio. Find them. Do what you can.

{{prior_failure_note}}

— Dr. Silveira
```
*If a prior medic failed this mission: `{{prior_failure_note}}` becomes "We sent someone last season. They didn't reach them."*

**Naturalist — specimen study**
```
FROM: Instituto Nacional de Pesquisas da Amazônia, Manaus
TO: [Name]

The breeding migration of the boto vermelho shifts significantly during dry years. Your grant
covers documentation of mating behavior at the confluence populations — specifically, whether
the song patterns have changed since the hydroelectric surveys.

Three weeks in the field minimum. Coordinate with river traders for resupply.

Your predecessor's notes are enclosed. They stopped at the Juruá confluence.

— Prof. Almeida
```

---

## Mission Types Per Archetype

```typescript
type MissionType =
  // Medic
  | "sick_village"              // find and treat a community with illness
  | "injured_traveler"          // find a specific injured person (more mobile objective)
  | "epidemic_source"           // trace a disease to its origin node

  // Naturalist
  | "specimen_collection"       // find and document a specific species behavior
  | "habitat_survey"            // assess ecological health in a target region
  | "migration_tracking"        // follow and document a species migration pattern

  // Correspondent
  | "find_source"               // locate a person with a story to tell
  | "document_incident"         // reach a location where something happened
  | "verify_rumor"              // travel to verify or disprove a story

  // River Guide
  | "navigation_survey"         // chart a stretch of river for future navigation
  | "rescue_operation"          // find a boat or person reported missing
  | "route_assessment"          // evaluate a new tributary for commercial use
```

---

## Mission Objective Seeding

When the compilation pass runs, it:

1. **Selects an objective node**: chooses a geography node at an appropriate distance from the start — far enough that the player must actually travel, close enough to be reachable before resource depletion. The node must match the mission type (e.g., a `settlement_viable` hub slot for a sick village mission).

2. **Marks the node in the run manifest**: the objective node gets a special flag in the manifest — `isMissionObjective: true`. This flag is not visible to the player. It tells the EncounterEngine to fire the mission resolution encounter when the player reaches this node.

3. **Seeds intel encounters**: distributes 2–4 intel encounters along reachable nodes before the objective. These encounters do not explicitly say "the objective is there" but give directional information a thoughtful player can use to narrow it down.

```typescript
interface MissionObjective {
  nodeId: string;                    // the target node
  missionType: MissionType;
  intelNodeIds: string[];            // nodes where intel encounters are seeded
  directionHints: DirectionHint[];   // what those intel encounters say
}

interface DirectionHint {
  nodeId: string;           // where this hint is delivered
  hintText: string;         // authored text, vague directional ("upstream from the black water tributary")
  hintSource: string;       // who delivers it (trader, villager, crew member)
  requiresStop: boolean;    // only delivered if player stops at this node (vs. passing)
}
```

### Intel Distribution Strategy

Intel hints narrow the search progressively. The first hint is broad (a region). The second is more specific (a tributary). The third (if reachable) is near-specific (a description the player can match against the environment).

A player who stops at every shore hub collects all available intel. A player who travels quickly gets fewer hints and relies more on judgment at forks.

---

## The Fog of War on Objectives

The player never sees a mission marker on the reference map. The objective node is not highlighted. The fog lifts through:

- **Intel encounters**: crew members or NPCs at shore hubs who know something about the objective vicinity
- **Radio tips** (Correspondent archetype mechanic): tips generated by human encounters that point toward the story
- **Field observation**: a Naturalist who has documented a species along the river narrows down where that species' behavior should be observable
- **Process of elimination**: having explored a branch and found nothing matching, the player can infer the objective is on the other branch

When the player arrives at the objective node, the encounter recognizes it — the sick village is there, the boto are there, the source is there. There is no dramatic announcement. The world simply delivers what was promised.

---

## Failure States

### Pull-Out (mission failed, character survives)
If the player cannot continue (resources critically low, forced to turn back), the run ends with a pull-out. The character survives. The mission is logged as `run_end_pullout`.

World consequences:
- The mission objective node gets an event entry: `mission_failed_this_run: true`
- The sick village (or equivalent) has now gone one more run unhelped. Its state worsens.
- The telegram for the next run of the same archetype may reference this obliquely.

The player feels the weight of not reaching it. The world moved on without them.

### Death (mission failed, character gone)
The objective was not reached. The character is gone. The world continues. The sick village is still out there. Someone else will have to go.

World consequences:
- Same as pull-out for the objective node
- Additionally: crew death events, character death event logged
- A new character (new archetype, new run) starts fresh — but the world shows the accumulated history

### Success
The player found the objective and resolved it. Mission logged as `run_end_success`.

World consequences:
- The objective node gets resolved state: `mission_resolved: true`, tagged with the archetype and run ID
- Regional effects based on the outcome (a healed village improves trust in the region, a documented species creates a conservation flag)
- The objective node may appear in future runs in a "post-resolution" state — the village is healthy now, or the research is ongoing

---

## Run History in Telegrams

The telegram is one of the few places the game explicitly acknowledges the player's history, and even here it is subtle. Telegrams don't say "You failed last time." They might say:

- "We haven't heard from anyone who's gone into that stretch."
- "Your predecessor's notes stop at the Juruá confluence." (implying they didn't come back)
- "The situation has apparently worsened since our last contact."

The `historicalReferences` system in the telegram template allows these callbacks to be conditional on world state. A run with no prior history gets the neutral version. A run with a prior failed medic mission gets the weighted version.

---

## Relationship to Existing Code

### `packages/shared/src/archetypes.ts`
The four archetype definitions gain a `missionTypes` field listing which mission types apply to them, and a `telegramPool` reference. The existing archetype mechanic properties (wildlife bonus, navigation bonus, etc.) are unchanged.

### `ArchetypeScene.ts`
The archetype selection scene gains a "telegram reveal" step after archetype selection. The player picks their archetype, then sees the telegram before entering the river. The telegram is displayed in a period-appropriate style (typewriter font, worn paper aesthetic).

### `RunEndScene.ts`
The run end scene already shows run summary. It gains a mission outcome section: success (what was accomplished), pullout (what was left unresolved), or death (what the character's last position was and what remains undone). This section is narrative, not statistical.

---

## Open Design Decisions

1. **Telegram pool size**: How many telegram templates per archetype per mission type? At minimum, 2–3 per type prevents immediate repetition. 5–8 per type creates genuine variety. This is a content writing goal.

2. **Mission objective difficulty scaling**: Should objectives get harder to reach as the player gains more runs? Earlier runs might seed the objective closer; later runs push it deeper. Or difficulty could be fixed and player knowledge of the river (via the persistent reference map) is what improves over time.

3. **Secondary objectives**: Should telegrams hint at secondary things the player can do (beyond the primary mission)? "If you pass through the upper Juruá, the Institute would be interested in any anaconda nesting observations." These aren't required for mission success but give the player additional engagement. The existing field note system already functions this way — this would formalize it.

4. **Mission continuity across runs**: If a medic fails to reach a sick village in run 4, and another medic goes looking for it in run 7, is it the same village (same node, now in worse state)? Or a different mission entirely? The current design seeds a new objective per run, but the node can retain its history. This means the player can accidentally find a prior mission's objective and encounter a resolved or worsened state — which is interesting world texture.
