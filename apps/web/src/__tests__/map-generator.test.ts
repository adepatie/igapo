import { describe, it, expect } from "vitest";
import { generateRun } from "../data/mapGenerator";

describe("mapGenerator", () => {
  const { nodes, edges } = generateRun();

  it("generates 14 nodes", () => {
    expect(nodes).toHaveLength(14);
  });

  it("generates 21 edges", () => {
    expect(edges).toHaveLength(21);
  });

  it("all nodes have required fields", () => {
    for (const node of nodes) {
      expect(node.id).toBeTruthy();
      expect(node.name).toBeTruthy();
      expect(node.type).toBeTruthy();
      expect(node.region).toBeTruthy();
      expect(typeof node.x).toBe("number");
      expect(typeof node.y).toBe("number");
      expect(node.encounterId).toBeTruthy();
    }
  });

  it("has start and destination nodes", () => {
    expect(nodes.find((n) => n.id === "start")).toBeDefined();
    expect(nodes.find((n) => n.id === "destination")).toBeDefined();
  });

  it("all node types are valid", () => {
    const validTypes = new Set(["town", "settlement", "wildlife", "discovery", "navigation", "story"]);
    for (const node of nodes) {
      expect(validTypes.has(node.type), `"${node.id}" has invalid type "${node.type}"`).toBe(true);
    }
  });

  it("all regions are valid", () => {
    const validRegions = new Set(["várzea", "igapó", "terra_firme"]);
    for (const node of nodes) {
      expect(validRegions.has(node.region), `"${node.id}" has invalid region "${node.region}"`).toBe(true);
    }
  });

  it("edges are directed (from → to)", () => {
    for (const edge of edges) {
      expect(edge.from).toBeTruthy();
      expect(edge.to).toBeTruthy();
      expect(edge.from).not.toBe(edge.to);
    }
  });
});
