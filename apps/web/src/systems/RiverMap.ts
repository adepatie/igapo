import Phaser from "phaser";
import type { RiverNode, RiverEdge } from "@igapo/shared";
import { GameState } from "./GameState";
import { generateRun } from "../data/mapGenerator";
import { selectEncounter } from "../data/encounterSelector";
import { computeBonuses } from "./BonusSystem";

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
  private tooltip!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
    const run = generateRun();
    this.nodes = run.nodes;
    this.edges = run.edges;
    const bonuses = computeBonuses(state);
    // Reveal starting neighbors at configured depth
    this.revealNeighbors(state.currentNodeId, bonuses.extraRevealDepth);
  }

  create() {
    this.rootContainer = this.scene.add.container(0, 0);
    this.drawBackground();
    this.drawTimeOfDayAtmosphere();
    this.drawWeatherOverlay();
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
    const bonuses = computeBonuses(this.state);
    this.revealNeighbors(node.id, bonuses.extraRevealDepth);
    this.refresh();

    onMoved?.(node.id);

    const encounter = selectEncounter(node, this.state);
    if (encounter) {
      this.scene.scene.launch("EncounterScene", { node: encounter, state: this.state });
      this.scene.scene.pause("MapScene");
    }
  }

  update(_time: number, _delta: number) {}

  // ── Weather overlay ───────────────────────────────────────────────────────

  private drawWeatherOverlay() {
    const { width, height } = this.scene.scale;
    const w = this.state.weather;
    if (w === "clear") return;

    const g = this.scene.add.graphics();

    if (w === "cloudy") {
      g.fillStyle(0x0a0e14, 0.18);
      g.fillRect(0, 0, width, height);
    } else if (w === "storm_approaching") {
      g.fillStyle(0x050810, 0.35);
      g.fillRect(0, 0, width, height);
      // Dark cloud mass on horizon (top-right)
      g.fillStyle(0x020406, 0.5);
      g.fillRect(width * 0.55, 0, width * 0.45, height * 0.3);
      // Warning text
      const warn = this.scene.add.text(width - 16, 16, "⚡ Storm Approaching", {
        fontSize: "11px", color: "#e8a020", fontFamily: "Georgia, serif", fontStyle: "italic",
      }).setOrigin(1, 0).setAlpha(0.85);
      this.rootContainer.add(warn);
    } else if (w === "storm") {
      g.fillStyle(0x020406, 0.55);
      g.fillRect(0, 0, width, height);
      // Rain streaks
      g.lineStyle(1, 0x1a2a3a, 0.4);
      for (let i = 0; i < 40; i++) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx + 8, ry + 20); g.strokePath();
      }
      const warn = this.scene.add.text(width / 2, 20, "STORM — Navigation Risk Elevated", {
        fontSize: "12px", color: "#c84040", fontFamily: "Georgia, serif", letterSpacing: 3,
      }).setOrigin(0.5, 0).setAlpha(0.9);
      this.rootContainer.add(warn);
    }

    this.rootContainer.add(g);
  }

  // ── Hover tooltip ─────────────────────────────────────────────────────────

  private showTooltip(node: RiverNode, x: number, y: number) {
    this.hideTooltip();
    const { width } = this.scene.scale;

    const hasRadioIntel = this.state.radioTipNodeIds.has(node.id);

    const lines: string[] = [node.name];
    if (node.hint) lines.push(node.hint);

    // Correspondent radio intel overrides the generic hint
    if (hasRadioIntel) {
      // Show a radio intel indicator line (the full tip text is in the HUD flash)
      lines.splice(1, lines.length - 1, "📻 Radio intel received");
    }

    // Time-gated hint
    const poolTimes = node.encounterPool?.flatMap(e => e.conditions?.timeOfDay ?? []);
    if (poolTimes && poolTimes.length > 0) {
      const unique = [...new Set(poolTimes)];
      lines.push(`Active: ${unique.join(", ")}`);
    }

    const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    lines.push(`${typeLabel}  ·  ${node.region}`);

    const tipW = 240;
    const tipH = lines.length * 16 + 16;
    let tx = x + 18;
    if (tx + tipW > width - 10) tx = x - tipW - 12;

    this.tooltip = this.scene.add.container(tx, y - tipH / 2);
    this.tooltip.setDepth(200);

    const borderColor = hasRadioIntel ? 0x4a7a8a : 0x3d2e0a;
    const bg = this.scene.add.rectangle(tipW / 2, tipH / 2, tipW, tipH, 0x0a0705, 0.92)
      .setStrokeStyle(1, borderColor);
    this.tooltip.add(bg);

    lines.forEach((line, i) => {
      const isTitle = i === 0;
      const isType = i === lines.length - 1;
      const isIntel = hasRadioIntel && i === 1;
      const t = this.scene.add.text(10, 8 + i * 16, line, {
        fontSize: isTitle ? "12px" : "10px",
        color: isTitle ? "#f5c842" : isIntel ? "#7a9aaa" : isType ? "#5a4a2a" : "#a09070",
        fontFamily: "Georgia, serif",
        fontStyle: isTitle ? "italic" : isIntel ? "italic" : "normal",
        wordWrap: { width: tipW - 20 },
      }).setOrigin(0, 0);
      this.tooltip.add(t);
    });
  }

  private hideTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
    }
  }

  private revealNeighbors(nodeId: string, depth: number = 1) {
    const visited = new Set<string>([nodeId]);
    let frontier = [nodeId];
    for (let d = 0; d < depth; d++) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const edge of this.edges) {
          if (edge.from === id && !visited.has(edge.to)) {
            this.state.revealNode(edge.to);
            visited.add(edge.to);
            next.push(edge.to);
          }
          if (edge.to === id && !visited.has(edge.from)) {
            this.state.revealNode(edge.from);
            visited.add(edge.from);
            next.push(edge.from);
          }
        }
      }
      frontier = next;
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
    this.drawSeasonOverlay();
    this.drawTimeOfDayAtmosphere();
    this.drawWeatherOverlay();
    this.drawRiver();
    this.drawEdges();
    this.drawNodes();
    this.drawLegend();
  }

  // ── Season overlay ────────────────────────────────────────────────────────

  private drawSeasonOverlay() {
    if (this.state.season !== "dry") return;
    const { width, height } = this.scene.scale;
    const g = this.scene.add.graphics();

    // Dry season: warm sienna tint — lower water, sandbanks exposed
    g.fillStyle(0x3a1a00, 0.12);
    g.fillRect(0, 0, width, height);

    // Sandbank suggestion — pale strips near the river's lower edge
    g.fillStyle(0xd4a84a, 0.07);
    g.fillRect(0, height * 0.55, width, height * 0.15);

    this.rootContainer.add(g);

    // Dry season label
    const label = this.scene.add.text(
      this.scene.scale.width / 2, 28,
      "Dry Season",
      {
        fontSize: "9px",
        color: "#8a5a20",
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        letterSpacing: 4,
      }
    ).setOrigin(0.5).setAlpha(0.65);
    this.rootContainer.add(label);
  }

  // ── Time-of-day atmosphere ────────────────────────────────────────────────

  private drawTimeOfDayAtmosphere() {
    const { width, height } = this.scene.scale;
    const g = this.scene.add.graphics();

    // Color and intensity per time of day
    const overlays: Record<string, [number, number]> = {
      // [hex color, alpha]
      dawn:      [0x3d1e00, 0.22],   // warm burnt orange bleed
      morning:   [0x0d1a0a, 0.08],   // nearly clear, slight cool green
      afternoon: [0x0a0d06, 0.0],    // neutral
      dusk:      [0x3d1500, 0.30],   // deep amber-red
      night:     [0x000814, 0.55],   // near-monochrome blue-black
    };

    const [color, alpha] = overlays[this.state.timeOfDay] ?? [0x000000, 0];
    if (alpha > 0) {
      g.fillStyle(color, alpha);
      g.fillRect(0, 0, width, height);
    }

    // Dawn/dusk: horizon glow from east (right side)
    if (this.state.timeOfDay === "dawn" || this.state.timeOfDay === "dusk") {
      const glow = this.state.timeOfDay === "dawn" ? 0xff8c20 : 0xff4a00;
      g.fillStyle(glow, 0.06);
      g.fillRect(width * 0.6, 0, width * 0.4, height);
      g.fillStyle(glow, 0.04);
      g.fillRect(width * 0.75, 0, width * 0.25, height);
    }

    // Night: stars (random dots, seeded by day number for consistency)
    if (this.state.timeOfDay === "night") {
      const rng = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      g.fillStyle(0xd4c9a0, 0.7);
      for (let i = 0; i < 60; i++) {
        const sx = rng(this.state.dayNumber * 100 + i * 7.3) * width;
        const sy = rng(this.state.dayNumber * 100 + i * 13.7) * height * 0.45;
        g.fillRect(sx, sy, 1, 1);
      }
    }

    this.rootContainer.add(g);

    // Time label (top center, subtle)
    const timeLabels: Record<string, string> = {
      dawn: "Dawn", morning: "Morning", afternoon: "Afternoon", dusk: "Dusk", night: "Night",
    };
    const timeColors: Record<string, string> = {
      dawn: "#c87820", morning: "#6a8a52", afternoon: "#5a6a4a", dusk: "#c85020", night: "#3a4a6a",
    };
    const todLabel = this.scene.add.text(
      this.scene.scale.width / 2, 48,
      timeLabels[this.state.timeOfDay] ?? "",
      {
        fontSize: "10px",
        color: timeColors[this.state.timeOfDay] ?? "#5a4a2a",
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        letterSpacing: 4,
      }
    ).setOrigin(0.5).setAlpha(0.7);
    this.rootContainer.add(todLabel);
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

      // Interactive hit area + tooltip
      const hitZone = this.scene.add.circle(node.x, node.y, NODE_RADIUS + 8, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hitZone.on("pointerover", (ptr: Phaser.Input.Pointer) => {
        if (node.id !== this.state.currentNodeId) label.setColor("#ffffff");
        icon.setAlpha(1);
        this.showTooltip(node, ptr.x, ptr.y);
      });
      hitZone.on("pointermove", (ptr: Phaser.Input.Pointer) => {
        this.showTooltip(node, ptr.x, ptr.y);
      });
      hitZone.on("pointerout", () => {
        label.setColor(isCurrent ? "#f5c842" : "#c8b87a");
        icon.setAlpha(alpha);
        this.hideTooltip();
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
