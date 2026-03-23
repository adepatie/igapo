# Content Management GUI

## Purpose

As the encounter template library grows, managing it in raw TypeScript files becomes untenable. The content management GUI is a standalone developer tool — a local web application — for authoring, organizing, and validating all narrative content: encounter templates, story arcs, characters, world state attributes, and telegram templates.

It reads and writes the same data files the game engine uses. There is no translation layer. Every change made in the GUI is immediately reflected in the game.

**This tool runs locally during development only. It is not shipped with the game.**

---

## Core Design Principles

**Same data format as the game.** The tool is a frontend over the game's data files. It does not maintain its own database. It opens, edits, and saves the same TypeScript/JSON files that `encounterData.ts`, `crew.ts`, etc. use.

**Validation over free-form editing.** Every reference to a character, world state attribute, or encounter ID is validated inline. Broken references are flagged immediately, not discovered at runtime.

**Arc-first organization.** The tool's primary organizing concept is the story arc — a named collection of encounter templates that form a narrative thread. Encounters are authored in the context of which arc they belong to.

**Read the world state, don't edit it.** The content tool can display the derived world state for reference, but it does not edit live world state. World state is the exclusive domain of the event log at runtime.

---

## Tech Approach

A local Node.js server (separate from the game's Vite dev server) serves a web UI. The UI communicates with the server via a simple REST API. The server reads and writes the game's data files directly.

```
Developer browser ──HTTP──▶ Local content server (Node/Express)
                               │
                               ├── reads/writes apps/web/src/data/encounterData.ts
                               ├── reads/writes packages/shared/src/crew.ts
                               ├── reads apps/web/src/data/mapGenerator.ts
                               └── reads/writes docs/arc-definitions.json (new file)
```

A new script in `package.json`:
```json
"content-tool": "node tools/content-server/index.js"
```

Running `npm run content-tool` starts the server and opens the browser at `localhost:3001`.

---

## Views

### 1. Arc View (default view)

A graph visualization of story arcs. Each arc is a named collection of encounter templates with connections between them.

**Left panel — Arc List:**
- All defined arcs, with encounter count and status (complete/in-progress/has-errors)
- "New arc" button
- Filter by archetype, region, status

**Main panel — Arc Graph:**
- Encounter template nodes, sized by variant count
- Directed edges between encounters labeled with the condition that connects them (e.g., "fires after village_arrival with outcome: success")
- Color coded by encounter type (shore_hub, transit_random, fork, ambient)
- Orphaned encounters (in no arc) shown in a separate "unassigned" cluster
- Clicking a node opens the Encounter Editor panel

**What the graph shows:**
The connections between encounters are inferred from preconditions, not manually drawn. If encounter B has a precondition of `{ query: "node.has_medical_history", op: "eq", value: true }` and encounter A produces that effect, the graph draws an edge A → B.

**Visual gap detection:**
The tool highlights arc structures that have dead ends (a branch that leads to no further encounters), or prerequisites that nothing in the arc satisfies. These are authoring gaps, not bugs — but they should be visible.

---

### 2. Encounter Editor

Opens when clicking an encounter node in the Arc View, or from the full encounter list.

**Header:**
- Template ID (editable)
- Type selector (shore_hub / transit_random / river_fork / transit_ambient)
- Arc membership (multi-select from arc list)
- Tags (multi-select from tag taxonomy)

**Placement Rules panel:**
- Checkboxes for node types, hub slot types, regions
- Dropdowns for seasons, times of day, weather
- Archetype selector
- minRun / maxRun number inputs
- Inline warning if placement rules are so narrow that this encounter may never fire

**Preconditions panel:**
- List of precondition entries, each showing: query (autocomplete from known attributes) + operator + value
- "Add precondition" button
- Inline validation: if a precondition references an attribute that no encounter produces, flag it

**Variants panel:**
- Ordered list of variants (most specific first = displayed first = evaluated first by engine)
- Each variant shows: its conditions, a preview of the opening text, and the crew reactions
- Drag-to-reorder
- "Add variant" button
- For each variant: a text editor for `openingText` and `synopsis`
- Variant condition editor (same UI as preconditions)

**Choices panel:**
- List of choices with their IDs, labels, success chances
- Field note and archetype requirements
- "Add choice" button
- Each choice shows which outcome effects it produces

**Outcome Effects panel:**
- For each choice ID: list of WorldEffect entries
- Target selector (node / region / character) with autocomplete
- Attribute name with autocomplete from known attributes
- Delta number input
- Inline warning if this effect modifies an attribute that no encounter queries (orphaned effect)

**Validation Summary:**
- All broken references highlighted in red
- All warnings (orphaned effects, narrow placement, missing fallback variant) shown in amber
- Green checkmark when no issues

---

### 3. Asset Index

A lookup tool: pick any asset and see everything that references it.

**Asset types searchable:**
- Character / crew member ID
- World state attribute name (e.g., `community_trust`, `extraction_level`)
- Tag
- Arc name
- Field note ID

**Results:**
- List of all encounter templates that reference the selected asset
- For each: how it's referenced (precondition, effect, choice requirement, crew reaction)
- Direct link to open that encounter in the Encounter Editor

**Use case:** Before removing or renaming a world state attribute, search for it here. See every encounter that would break. Fix them before making the change.

---

### 4. World State Dashboard

A reference view of all derived state attributes — their derivation rules, which encounters produce them, and which encounters read them.

**Layout:**

| Attribute | Scope | Decay | Produced By | Read By |
|---|---|---|---|---|
| `community_trust` | node | 20%/run | village_medical_aid (+2), take_supplies (-1), ... | village_arrival (precond), ... |
| `extraction_level` | node | none | logging_encounter (+3), ... | habitat_degraded (precond), ... |
| `medic_reputation` | region | 15%/run | ... | ... |

Each row is expandable to show full details.

**Editing decay rules:** The decay rate for each attribute is editable here. Changes are written to the derivation configuration (a new config file consumed by the derivation layer).

**Propagation rules:** Shows the propagation weights (adjacent node spread, regional spread) per attribute. Editable.

**"What would happen if...":** A simulation panel. Enter a sequence of hypothetical events (character runs medic for 5 runs, helping villages). The tool computes what the derived state snapshot would look like after those events. Useful for testing whether the derivation rules produce the intended world feel.

---

### 5. Character Registry

A management view for all crew members and named NPCs.

**Columns:** Name, Role, Status, Current Location, Trust (aggregate across all runs), Appearances (how many encounters reference them), Last Run

**Clicking a character:**
- Full `CrewRecord` details
- Trait list with evolution paths
- All encounters where they appear (with arc context)
- Relationship history timeline (run by run)

**Adding new crew:** Form to create a new `CrewRecord` entry. The tool validates that the new crew's trait IDs don't conflict with existing crew. It adds the entry to `crew.ts`.

**Encounter appearances:** When a crew member is referenced in encounter text (as a `crewReaction` or in a `crewPresent` encounter), those appearances are listed here. This lets the author ensure a crew member's dialog is consistent with their personality across all encounters.

---

### 6. Telegram Manager

A view specific to the Mission System.

**Per archetype, per mission type:** A list of telegram templates with their `bodyText`, `worldStateConditions`, and `historicalReferences`.

**Editing interface:**
- Full text editor for telegram body
- Inline `{{placeholder}}` insertion for historical references
- Condition editor for when each historical reference fires
- Preview mode: shows what the telegram looks like with different world states applied (based on "What would happen if..." simulation results)

---

## Validation System

The tool runs validation continuously as content is edited. Validation categories:

**Errors (block saving):**
- Broken encounter ID reference (an encounter pool or precondition references an ID that doesn't exist)
- Broken character ID reference
- Template with no variants at all
- Variant with conditions but no fallback variant (engine has nothing to fall back to)

**Warnings (allow saving, flag for review):**
- Encounter with placement rules so narrow it may never fire in practice
- Effect that modifies an attribute no encounter queries (orphaned effect)
- Character referenced in encounter text who has no `CrewRecord`
- Arc with no reachable resolution (all paths lead to dead ends)
- Telegram with a `historicalReference` whose condition is impossible to satisfy

**Info:**
- Encounters not assigned to any arc (orphaned content)
- Variants with identical conditions (one will never fire)

---

## File Format Considerations

The game currently stores encounter content in TypeScript files (`encounterData.ts`, `crew.ts`). The content tool needs to read and write these files.

**Option A: TypeScript AST manipulation.** The server parses the TypeScript files into ASTs, modifies them, and writes back. Preserves the existing format exactly. Complex to implement.

**Option B: JSON data files, TypeScript wrappers.** Migrate encounter content to `.json` files. TypeScript files become thin wrappers that import and re-export. The content tool reads/writes JSON. Simpler implementation, requires a one-time migration of `encounterData.ts` to JSON format.

**Option B is recommended.** The migration is straightforward (the data structures are already well-typed) and it makes the content tool significantly simpler to build. The game engine sees no difference — it still imports typed data.

New file structure:
```
apps/web/src/data/
├── encounters/
│   ├── wildlife.json
│   ├── settlements.json
│   ├── navigation.json
│   ├── story.json
│   └── transit.json
├── encounterData.ts      ← imports all JSON, re-exports typed ENCOUNTERS map
├── arcs.json             ← arc definitions (new)
└── telegrams.json        ← telegram templates (new)

packages/shared/
├── crew.json             ← crew definitions (migrated from crew.ts)
├── crew.ts               ← imports JSON, re-exports typed CREW array
```

---

## Open Design Decisions

1. **Phaser scene / ship relationship**: Does the content tool need to load a Phaser instance to preview encounters? For text/choice previewing, no — a plain web page is sufficient. For visual previewing (what does this encounter look like in the river view), a lightweight Phaser embed might be useful but is not essential for v1.

2. **Arc definition format**: Arcs need a formal definition beyond "tags on encounters." The `arcs.json` file should define arcs with an ID, name, description, and list of encounter IDs that belong to it. Arc membership on the encounter template becomes a reference to an arc ID.

3. **Version history**: Should the tool maintain a change log of edits? Git handles this at the file level, but an in-tool "undo" for content editing would be useful. v1 can rely on git for version history.

4. **Multi-user**: This is a solo development tool. No collaboration features are needed. If the project ever grows to a team, this constraint would change.

5. **Export/import**: Should the tool support exporting subsets of content (e.g., "export this arc as a standalone package")? Not needed for v1 but worth designing the JSON format to support later.
