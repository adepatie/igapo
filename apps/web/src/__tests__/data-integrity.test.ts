import { describe, it, expect } from "vitest";
import { ENCOUNTERS, FIELD_NOTES_BY_ID } from "../data/encounterData";
import { generateRun } from "../data/mapGenerator";
import { META_FRAGMENTS } from "../data/metaFragments";

// Collect all choice IDs across all encounters
function allChoiceIds(): Set<string> {
  const ids = new Set<string>();
  for (const enc of Object.values(ENCOUNTERS)) {
    for (const choice of enc.choices) {
      ids.add(choice.id);
    }
  }
  return ids;
}

describe("Data Integrity", () => {
  const { nodes, edges } = generateRun();

  describe("Map → Encounter references", () => {
    it("every node primary encounterId exists in ENCOUNTERS", () => {
      for (const node of nodes) {
        expect(
          ENCOUNTERS[node.encounterId],
          `Node "${node.id}" references missing encounter "${node.encounterId}"`
        ).toBeDefined();
      }
    });

    it("every encounter pool entry references a valid encounter", () => {
      for (const node of nodes) {
        for (const entry of node.encounterPool ?? []) {
          expect(
            ENCOUNTERS[entry.encounterId],
            `Node "${node.id}" pool references missing encounter "${entry.encounterId}"`
          ).toBeDefined();
        }
      }
    });
  });

  describe("Encounter structure", () => {
    it("every encounter has required fields", () => {
      for (const [id, enc] of Object.entries(ENCOUNTERS)) {
        expect(enc.title, `${id} missing title`).toBeTruthy();
        expect(enc.type, `${id} missing type`).toBeTruthy();
        expect(enc.arrivalText, `${id} missing arrivalText`).toBeTruthy();
        expect(enc.choices.length, `${id} has no choices`).toBeGreaterThan(0);
      }
    });

    it("every encounter type is valid", () => {
      const validTypes = new Set(["wildlife", "human", "navigation", "discovery", "story"]);
      for (const [id, enc] of Object.entries(ENCOUNTERS)) {
        expect(
          validTypes.has(enc.type),
          `${id} has invalid type "${enc.type}"`
        ).toBe(true);
      }
    });

    it("every choice with requiresFieldNote references a valid field note", () => {
      for (const [encId, enc] of Object.entries(ENCOUNTERS)) {
        for (const choice of enc.choices) {
          if (choice.requiresFieldNote) {
            expect(
              FIELD_NOTES_BY_ID[choice.requiresFieldNote],
              `${encId} choice "${choice.id}" requires missing field note "${choice.requiresFieldNote}"`
            ).toBeDefined();
          }
        }
      }
    });

    it("every choice has a non-empty label", () => {
      for (const [encId, enc] of Object.entries(ENCOUNTERS)) {
        for (const choice of enc.choices) {
          expect(choice.label, `${encId} choice "${choice.id}" has empty label`).toBeTruthy();
        }
      }
    });

    it("no duplicate choice IDs within a single encounter", () => {
      for (const [encId, enc] of Object.entries(ENCOUNTERS)) {
        const ids = enc.choices.map((c) => c.id);
        const uniqueIds = new Set(ids);
        expect(
          uniqueIds.size,
          `${encId} has duplicate choice IDs: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`
        ).toBe(ids.length);
      }
    });
  });

  describe("Meta-fragment triggers", () => {
    // META_FRAGMENT_TRIGGERS is not exported from Codex, so we test
    // that the fragments referenced in metaFragments.ts all exist
    it("all meta fragments have required fields", () => {
      for (const [id, frag] of Object.entries(META_FRAGMENTS)) {
        expect(frag.id, `${id} missing id`).toBeTruthy();
        expect(frag.title, `${id} missing title`).toBeTruthy();
        expect(frag.body, `${id} missing body`).toBeTruthy();
        expect(frag.source, `${id} missing source`).toBeTruthy();
      }
    });

    it("fragment IDs are consistent with keys", () => {
      for (const [key, frag] of Object.entries(META_FRAGMENTS)) {
        expect(frag.id, `Key "${key}" doesn't match fragment id "${frag.id}"`).toBe(key);
      }
    });
  });

  describe("Field notes", () => {
    it("all field notes have required fields", () => {
      for (const [id, note] of Object.entries(FIELD_NOTES_BY_ID)) {
        expect(note.id, `${id} missing id`).toBeTruthy();
        expect(note.species, `${id} missing species`).toBeTruthy();
        expect(note.text, `${id} missing text`).toBeTruthy();
      }
    });

    it("field note IDs are consistent with keys", () => {
      for (const [key, note] of Object.entries(FIELD_NOTES_BY_ID)) {
        expect(note.id, `Key "${key}" doesn't match note id "${note.id}"`).toBe(key);
      }
    });
  });

  describe("Map graph connectivity", () => {
    it("start node exists", () => {
      expect(nodes.find((n) => n.id === "start")).toBeDefined();
    });

    it("destination node exists", () => {
      expect(nodes.find((n) => n.id === "destination")).toBeDefined();
    });

    it("all edge node references are valid", () => {
      const nodeIds = new Set(nodes.map((n) => n.id));
      for (const edge of edges) {
        expect(nodeIds.has(edge.from), `Edge from unknown node "${edge.from}"`).toBe(true);
        expect(nodeIds.has(edge.to), `Edge to unknown node "${edge.to}"`).toBe(true);
      }
    });

    it("destination is reachable from start", () => {
      const adj = new Map<string, string[]>();
      for (const edge of edges) {
        if (!adj.has(edge.from)) adj.set(edge.from, []);
        adj.get(edge.from)!.push(edge.to);
      }

      const visited = new Set<string>();
      const queue = ["start"];
      while (queue.length > 0) {
        const node = queue.shift()!;
        if (visited.has(node)) continue;
        visited.add(node);
        for (const neighbor of adj.get(node) ?? []) {
          queue.push(neighbor);
        }
      }

      expect(visited.has("destination"), "destination is not reachable from start").toBe(true);
    });

    it("no isolated nodes (every node is reachable from start)", () => {
      const adj = new Map<string, string[]>();
      for (const edge of edges) {
        if (!adj.has(edge.from)) adj.set(edge.from, []);
        adj.get(edge.from)!.push(edge.to);
      }

      const visited = new Set<string>();
      const queue = ["start"];
      while (queue.length > 0) {
        const node = queue.shift()!;
        if (visited.has(node)) continue;
        visited.add(node);
        for (const neighbor of adj.get(node) ?? []) {
          queue.push(neighbor);
        }
      }

      for (const node of nodes) {
        expect(
          visited.has(node.id),
          `Node "${node.id}" is not reachable from start`
        ).toBe(true);
      }
    });

    it("no duplicate node IDs", () => {
      const ids = nodes.map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
