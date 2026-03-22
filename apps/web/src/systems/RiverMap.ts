import Phaser from "phaser";
import type { RiverNode, RiverEdge } from "@igapo/shared";
import { GameState } from "./GameState";
import { generateRun } from "../data/mapGenerator";

const NODE_RADIUS = 14;
const COLORS = {
  visited: 0x8b6914,
  revealed: 0x4a7c59,
  hidden: 0x2a2a2a,
  current: 0xf5c842,
  edge: 0x3d5a40,
  edgeFog: 0x222222,
  label: "#e8d5a3",
};

/**
 * RiverMap — renders and manages the overhead river graph.
 */
export class RiverMap {
  private scene: Phaser.Scene;
  private state: GameState;
  private nodes: RiverNode[];
  private edges: RiverEdge[];
  private graphics!: Phaser.GameObjects.Graphics;
  private nodeCircles: Map<string, Phaser.GameObjects.Arc> = new Map();
  private labels: Map<string, Phaser.GameObjects.Text> = new Map();

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
    const run = generateRun();
    this.nodes = run.nodes;
    this.edges = run.edges;

    // Reveal neighbors of starting node
    this.revealNeighbors(state.currentNodeId);
  }

  create() {
    this.graphics = this.scene.add.graphics();
    this.drawEdges();
    this.drawNodes();
  }

  handleClick(pointer: Phaser.Input.Pointer) {
    const node = this.nodeAt(pointer.x, pointer.y);
    if (!node) return;
    if (!this.state.revealedNodeIds.has(node.id)) return;
    if (node.id === this.state.currentNodeId) return;
    if (!this.isAdjacent(this.state.currentNodeId, node.id)) return;

    this.state.visitNode(node.id);
    this.state.advanceTime();
    this.state.drainResources({ fuel: 10, food: 5 });
    this.revealNeighbors(node.id);
    this.refresh();

    // Launch encounter for this node
    this.scene.scene.launch("EncounterScene", {
      node,
      state: this.state,
    });
    this.scene.scene.pause("MapScene");
  }

  update(_time: number, _delta: number) {}

  private revealNeighbors(nodeId: string) {
    for (const edge of this.edges) {
      if (edge.from === nodeId) this.state.revealNode(edge.to);
      if (edge.to === nodeId) this.state.revealNode(edge.from);
    }
  }

  private isAdjacent(a: string, b: string): boolean {
    return this.edges.some(
      (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a)
    );
  }

  private nodeAt(x: number, y: number): RiverNode | undefined {
    return this.nodes.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS + 6;
    });
  }

  private refresh() {
    this.graphics.clear();
    this.nodeCircles.forEach((c) => c.destroy());
    this.labels.forEach((l) => l.destroy());
    this.nodeCircles.clear();
    this.labels.clear();
    this.drawEdges();
    this.drawNodes();
  }

  private drawEdges() {
    for (const edge of this.edges) {
      const from = this.nodes.find((n) => n.id === edge.from);
      const to = this.nodes.find((n) => n.id === edge.to);
      if (!from || !to) continue;

      const revealed =
        this.state.revealedNodeIds.has(from.id) &&
        this.state.revealedNodeIds.has(to.id);

      this.graphics.lineStyle(2, revealed ? COLORS.edge : COLORS.edgeFog, 0.6);
      this.graphics.beginPath();
      this.graphics.moveTo(from.x, from.y);
      this.graphics.lineTo(to.x, to.y);
      this.graphics.strokePath();
    }
  }

  private drawNodes() {
    for (const node of this.nodes) {
      const isCurrent = node.id === this.state.currentNodeId;
      const isVisited = this.state.visitedNodeIds.has(node.id);
      const isRevealed = this.state.revealedNodeIds.has(node.id);

      let color = COLORS.hidden;
      if (isCurrent) color = COLORS.current;
      else if (isVisited) color = COLORS.visited;
      else if (isRevealed) color = COLORS.revealed;

      const alpha = isRevealed ? 1 : 0.25;

      const circle = this.scene.add.circle(node.x, node.y, NODE_RADIUS, color, alpha);
      circle.setInteractive(
        new Phaser.Geom.Circle(0, 0, NODE_RADIUS + 6),
        Phaser.Geom.Circle.Contains
      );
      this.nodeCircles.set(node.id, circle);

      if (isRevealed) {
        const label = this.scene.add.text(node.x, node.y + NODE_RADIUS + 8, node.name, {
          fontSize: "11px",
          color: COLORS.label,
          fontFamily: "Georgia, serif",
          align: "center",
        }).setOrigin(0.5, 0);
        this.labels.set(node.id, label);
      }
    }
  }
}
