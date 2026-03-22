import Phaser from "phaser";
import type { RiverNode, RiverEdge } from "@igapo/shared";
import { GameState } from "./GameState";
import { generateRun } from "../data/mapGenerator";
import { ENCOUNTERS } from "../data/encounterData";

const NODE_RADIUS = 13;

// Node type → icon glyph (rendered as text)
const NODE_ICONS: Record<string, string> = {
  town: "⌂",
  settlement: "◈",
  wildlife: "◉",
  discovery: "✦",
  navigation: "⬡",
  story: "★",
};

const NODE_COLORS: Record<string, number> = {
  town: 0xe8a020,
  settlement: 0xc8945a,
  wildlife: 0x6ab04c,
  discovery: 0xf5c842,
  navigation: 0x4a9ade,
  story: 0xe84040,
};

export class RiverMap {
  private scene: Phaser.Scene;
  private state: GameState;
  private nodes: RiverNode[];
  private edges: RiverEdge[];
  private rootContainer!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
    const run = generateRun();
    this.nodes = run.nodes;
    this.edges = run.edges;
    this.revealNeighbors(state.currentNodeId);
  }

  create() {
    this.rootContainer = this.scene.add.container(0, 0);
    this.drawBackground();
    this.drawRiver();
    this.drawEdges();
    this.drawNodes();
    this.drawLegend();
  }

  handleClick(pointer: Phaser.Input.Pointer, onMoved?: (nodeId: string) => void) {
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

    onMoved?.(node.id);

    const encounter = ENCOUNTERS[node.encounterId];
    if (encounter) {
      this.scene.scene.launch("EncounterScene", { node: encounter, state: this.state });
      this.scene.scene.pause("MapScene");
    }
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
      return Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS + 8;
    });
  }

  private refresh() {
    this.rootContainer.destroy();
    this.rootContainer = this.scene.add.container(0, 0);
    this.drawBackground();
    this.drawRiver();
    this.drawEdges();
    this.drawNodes();
    this.drawLegend();
  }

  // ── Background ────────────────────────────────────────────────────────────

  private drawBackground() {
    const { width, height } = this.scene.scale;

    // Base parchment
    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x0f0c07);
    this.rootContainer.add(bg);

    // Subtle vignette using radial-ish graduated rectangles
    const g = this.scene.add.graphics();
    g.fillStyle(0x000000, 0.35);
    g.fillRect(0, 0, width * 0.18, height);
    g.fillRect(width * 0.82, 0, width * 0.18, height);
    g.fillStyle(0x000000, 0.2);
    g.fillRect(0, 0, width, height * 0.12);
    g.fillRect(0, height * 0.88, width, height * 0.12);
    this.rootContainer.add(g);

    // Faint grid lines (map paper effect)
    const grid = this.scene.add.graphics();
    grid.lineStyle(1, 0x2a2010, 0.15);
    for (let x = 0; x < width; x += 60) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, height); grid.strokePath();
    }
    for (let y = 0; y < height; y += 60) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(width, y); grid.strokePath();
    }
    this.rootContainer.add(grid);

    // Map title
    const mapTitle = this.scene.add.text(width / 2, 28, "RIO VÁRZEA EXPEDITION", {
      fontSize: "11px",
      color: "#4a3820",
      fontFamily: "Georgia, serif",
      letterSpacing: 6,
    }).setOrigin(0.5, 0).setAlpha(0.7);
    this.rootContainer.add(mapTitle);

    // Compass rose (simplified)
    this.drawCompass(width - 60, height - 60);
  }

  private drawCompass(x: number, y: number) {
    const g = this.scene.add.graphics().setAlpha(0.4);
    g.lineStyle(1, 0x8a7a52);
    // N-S line
    g.beginPath(); g.moveTo(x, y - 22); g.lineTo(x, y + 22); g.strokePath();
    // E-W line
    g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x + 22, y); g.strokePath();
    // Diagonal ticks
    g.lineStyle(1, 0x8a7a52, 0.5);
    g.beginPath(); g.moveTo(x - 14, y - 14); g.lineTo(x + 14, y + 14); g.strokePath();
    g.beginPath(); g.moveTo(x + 14, y - 14); g.lineTo(x - 14, y + 14); g.strokePath();

    this.rootContainer.add(g);
    const n = this.scene.add.text(x, y - 28, "N", {
      fontSize: "10px", color: "#8a7a52", fontFamily: "Georgia, serif",
    }).setOrigin(0.5, 1).setAlpha(0.5);
    this.rootContainer.add(n);
  }

  // ── River ─────────────────────────────────────────────────────────────────

  private drawRiver() {
    const g = this.scene.add.graphics();

    // Main river channel — drawn as a thick bezier behind all nodes
    // Uses node positions to guide a flowing path
    const revealed = this.nodes.filter((n) => this.state.revealedNodeIds.has(n.id));
    const all = this.nodes;

    // Draw main channel shadow (wide, dark)
    g.lineStyle(18, 0x0a0d0f, 0.6);
    this.drawRiverPath(g, all);

    // Draw revealed river segments (mid tones)
    g.lineStyle(12, 0x1a2e35, 0.8);
    this.drawRiverPath(g, revealed);

    // River highlight
    g.lineStyle(5, 0x243d42, 0.5);
    this.drawRiverPath(g, revealed);

    // Fog-of-war: dim unrevealed zones
    const hidden = all.filter((n) => !this.state.revealedNodeIds.has(n.id));
    g.lineStyle(12, 0x0a0d0f, 0.9);
    this.drawRiverPath(g, hidden);

    this.rootContainer.add(g);
  }

  private drawRiverPath(g: Phaser.GameObjects.Graphics, nodes: RiverNode[]) {
    if (nodes.length < 2) return;
    const sorted = [...nodes].sort((a, b) => a.x - b.x);
    g.beginPath();
    g.moveTo(sorted[0].x, sorted[0].y);
    for (let i = 1; i < sorted.length; i++) {
      // Interpolate 8 midpoints between nodes for a smooth curve
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const steps = 8;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        // Simple hermite-style interpolation
        const x = prev.x + (curr.x - prev.x) * t;
        const midY = (prev.y + curr.y) / 2;
        const y = prev.y + (midY - prev.y) * Math.sin((t * Math.PI) / 1) + (curr.y - prev.y) * t;
        g.lineTo(x, y);
      }
    }
    g.strokePath();
  }

  // ── Edges ─────────────────────────────────────────────────────────────────

  private drawEdges() {
    const g = this.scene.add.graphics();

    for (const edge of this.edges) {
      const from = this.nodes.find((n) => n.id === edge.from);
      const to = this.nodes.find((n) => n.id === edge.to);
      if (!from || !to) continue;

      const bothRevealed =
        this.state.revealedNodeIds.has(from.id) &&
        this.state.revealedNodeIds.has(to.id);

      if (bothRevealed) {
        // Dashed route line
        g.lineStyle(1.5, 0x6b5a34, 0.7);
        this.drawDashedLine(g, from.x, from.y, to.x, to.y, 8, 4);
      } else if (
        this.state.revealedNodeIds.has(from.id) ||
        this.state.revealedNodeIds.has(to.id)
      ) {
        // One end revealed — faint suggestion
        g.lineStyle(1, 0x2a2010, 0.3);
        this.drawDashedLine(g, from.x, from.y, to.x, to.y, 4, 6);
      }
    }

    this.rootContainer.add(g);
  }

  private drawDashedLine(
    g: Phaser.GameObjects.Graphics,
    x1: number, y1: number,
    x2: number, y2: number,
    dashLen: number,
    gapLen: number
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    let dist = 0;
    let drawing = true;
    while (dist < len) {
      const segLen = Math.min(drawing ? dashLen : gapLen, len - dist);
      if (drawing) {
        g.beginPath();
        g.moveTo(x1 + ux * dist, y1 + uy * dist);
        g.lineTo(x1 + ux * (dist + segLen), y1 + uy * (dist + segLen));
        g.strokePath();
      }
      dist += segLen;
      drawing = !drawing;
    }
  }

  // ── Nodes ─────────────────────────────────────────────────────────────────

  private drawNodes() {
    for (const node of this.nodes) {
      const isCurrent = node.id === this.state.currentNodeId;
      const isVisited = this.state.visitedNodeIds.has(node.id);
      const isRevealed = this.state.revealedNodeIds.has(node.id);

      if (!isRevealed) continue;

      const typeColor = NODE_COLORS[node.type] ?? 0x8a7a52;
      const alpha = isVisited && !isCurrent ? 0.55 : 1.0;

      // Outer glow ring for current node
      if (isCurrent) {
        const glow = this.scene.add.graphics();
        glow.lineStyle(2, 0xf5c842, 0.4);
        glow.strokeCircle(node.x, node.y, NODE_RADIUS + 8);
        this.rootContainer.add(glow);
        this.scene.tweens.add({
          targets: glow,
          alpha: 0,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }

      // Node circle
      const g = this.scene.add.graphics().setAlpha(alpha);
      g.fillStyle(0x0d0a06, 1);
      g.fillCircle(node.x, node.y, NODE_RADIUS);
      g.lineStyle(isCurrent ? 2 : 1.5, isCurrent ? 0xf5c842 : typeColor, 1);
      g.strokeCircle(node.x, node.y, NODE_RADIUS);
      this.rootContainer.add(g);

      // Icon
      const icon = this.scene.add.text(node.x, node.y, NODE_ICONS[node.type] ?? "●", {
        fontSize: "11px",
        color: isCurrent ? "#f5c842" : Phaser.Display.Color.IntegerToColor(typeColor).rgba,
        fontFamily: "monospace",
      }).setOrigin(0.5).setAlpha(alpha);
      this.rootContainer.add(icon);

      // Label
      const label = this.scene.add.text(node.x, node.y + NODE_RADIUS + 7, node.name, {
        fontSize: "10px",
        color: isCurrent ? "#f5c842" : "#c8b87a",
        fontFamily: "Georgia, serif",
        align: "center",
      }).setOrigin(0.5, 0).setAlpha(alpha);
      this.rootContainer.add(label);

      // Visited tick
      if (isVisited && !isCurrent) {
        const tick = this.scene.add.text(node.x + NODE_RADIUS + 3, node.y - NODE_RADIUS - 3, "✓", {
          fontSize: "9px",
          color: "#6ab04c",
          fontFamily: "monospace",
        }).setOrigin(0, 1).setAlpha(0.7);
        this.rootContainer.add(tick);
      }

      // Interactive hit area
      const hitZone = this.scene.add.circle(node.x, node.y, NODE_RADIUS + 8, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hitZone.on("pointerover", () => {
        if (node.id !== this.state.currentNodeId) {
          label.setColor("#ffffff");
          icon.setAlpha(1);
        }
      });
      hitZone.on("pointerout", () => {
        label.setColor(isCurrent ? "#f5c842" : "#c8b87a");
        icon.setAlpha(alpha);
      });
      this.rootContainer.add(hitZone);
    }
  }

  // ── Legend ────────────────────────────────────────────────────────────────

  private drawLegend() {
    const startX = 20;
    const startY = this.scene.scale.height - 120;
    const entries: [string, string, number][] = [
      ["⌂", "Town / Resupply", NODE_COLORS.town],
      ["◈", "Settlement", NODE_COLORS.settlement],
      ["◉", "Wildlife", NODE_COLORS.wildlife],
      ["✦", "Discovery", NODE_COLORS.discovery],
      ["⬡", "Navigation", NODE_COLORS.navigation],
      ["★", "Story", NODE_COLORS.story],
    ];

    const legendBg = this.scene.add.rectangle(startX + 68, startY + entries.length * 14, 140, entries.length * 16 + 8, 0x0d0a06, 0.7).setOrigin(0.5);
    this.rootContainer.add(legendBg);

    entries.forEach(([icon, label, color], i) => {
      const y = startY + i * 16 + 4;
      const colorHex = "#" + color.toString(16).padStart(6, "0");
      const t = this.scene.add.text(startX + 6, y, `${icon}  ${label}`, {
        fontSize: "10px",
        color: colorHex,
        fontFamily: "Georgia, serif",
      }).setOrigin(0, 0.5).setAlpha(0.75);
      this.rootContainer.add(t);
    });
  }
}
