import Phaser from "phaser";
import { ARCHETYPES, CREW_POOL } from "@igapo/shared";
import type { ArchetypeId, RiverNode, RiverEdge, CrewMember } from "@igapo/shared";
import type { RiverMovementState } from "@igapo/shared";
import { GameState } from "../systems/GameState";
import { CrisisManager } from "../systems/CrisisManager";
import { selectEncounter } from "../data/encounterSelector";
import { generateRun } from "../data/mapGenerator";
import { ambientSound } from "../systems/AmbientSound";
import { CrewRegistry } from "../systems/CrewRegistry";
import { compile as compileRunManifest } from "../systems/WorldPopulationEngine";
import { Codex } from "../systems/Codex";
import { seedMissionObjective } from "../systems/MissionSystem";

interface MapSceneData {
  archetypeId: ArchetypeId;
}

/** Width of the right-hand navigation panel in pixels. */
const PANEL_W = 320;
/** Duration of the river travel animation in milliseconds. */
const TRAVEL_MS = 1800;
/** River scroll speed in pixels per second during travel. */
const SCROLL_PX_PER_S = 200;

export class MapScene extends Phaser.Scene {
  private state!: GameState;
  private crisis!: CrisisManager;
  private runNodes: RiverNode[] = [];
  private runEdges: RiverEdge[] = [];

  // River parallax offsets (accumulated over time during travel)
  private treeOffsetX = 0;
  private waterOffsetX = 0;
  private bankOffsetX = 0;

  // Movement state machine
  private movementState: RiverMovementState = "STOPPED";
  private travelElapsed = 0;
  private pendingDestId: string | null = null;

  // River graphics layers (cleared and redrawn each frame)
  private skyGfx!: Phaser.GameObjects.Graphics;
  private treeGfx!: Phaser.GameObjects.Graphics;
  private waterGfx!: Phaser.GameObjects.Graphics;
  private bankGfx!: Phaser.GameObjects.Graphics;

  // Navigation UI container (rebuilt on each location change)
  private navContainer!: Phaser.GameObjects.Container;

  // Travel destination indicator
  private travelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "MapScene" });
  }

  init(data: MapSceneData) {
    const archetype = ARCHETYPES.find((a) => a.id === data.archetypeId) ?? ARCHETYPES[0];
    this.state = new GameState(archetype);

    // Crew from registry (seeds from CREW_POOL on first run, persists across runs)
    const available = CrewRegistry.availableAtStart(archetype.id);
    this.state.crew = available.slice(0, 2)
      .map((cs) => CREW_POOL.find((p) => p.id === cs.crewId))
      .filter((m): m is CrewMember => m !== undefined);

    // Map graph — single call shared between river rendering and navigation
    const run = generateRun();
    this.runNodes = run.nodes;
    this.runEdges = run.edges;

    // WorldPopulationEngine compilation pass — pre-compiles encounter variant
    // selection for this run based on accumulated world state
    const codex = Codex.load();
    this.state.runManifest = compileRunManifest({
      archetypeId: archetype.id,
      derivedState: this.state.derivedState,
      runId: this.state.runId,
      runCount: codex.totalRuns,
      crewManifest: available.map((cs) => cs.crewId),
      runNodes: this.runNodes,
      missionObjective: seedMissionObjective(
        archetype.id,
        this.state.derivedState,
        this.runNodes.map((n) => n.id),
      ),
    });
  }

  create() {
    const { width, height } = this.scale;
    this.input.once("pointerdown", () => ambientSound.start());

    // River view layers (depth 0–3, drawn bottom to top each frame)
    this.skyGfx   = this.add.graphics().setDepth(0);
    this.treeGfx  = this.add.graphics().setDepth(1);
    this.waterGfx = this.add.graphics().setDepth(2);
    this.bankGfx  = this.add.graphics().setDepth(3);

    // Panel background and separator (static, depth 8–9)
    this.add.rectangle(width - PANEL_W / 2, height / 2, PANEL_W, height, 0x090705, 0.97)
      .setDepth(8);
    this.add.rectangle(width - PANEL_W, height / 2, 1, height, 0x2a1e08)
      .setOrigin(0.5).setDepth(9);

    // Navigation container rebuilt on each location change
    this.navContainer = this.add.container(0, 0).setDepth(20);

    // Travel destination indicator (shown during river animation)
    this.travelText = this.add.text(
      (width - PANEL_W) / 2, height - 80, "",
      { fontSize: "14px", color: "#7a6a4a", fontFamily: "Georgia, serif", fontStyle: "italic" },
    ).setOrigin(0.5).setDepth(25).setAlpha(0);

    // Crisis manager
    this.crisis = new CrisisManager(this, this.state);

    // HUD overlay (persistent parallel scene)
    this.scene.launch("UIScene", { state: this.state });

    // Refresh nav panel on return from EncounterScene
    this.events.on("wake", () => this.renderLocationPanel());

    this.drawRiverLayers();
    this.renderLocationPanel();
  }

  update(_time: number, delta: number) {
    const s = delta / 1000;
    if (this.movementState === "TRAVELING") {
      this.travelElapsed += delta;
      this.treeOffsetX  = (this.treeOffsetX  + SCROLL_PX_PER_S * 0.25 * s) % 800;
      this.waterOffsetX = (this.waterOffsetX + SCROLL_PX_PER_S * s)         % 400;
      this.bankOffsetX  = (this.bankOffsetX  + SCROLL_PX_PER_S * 1.6 * s)  % 600;

      if (this.travelElapsed >= TRAVEL_MS) {
        this.completeTravelTo(this.pendingDestId!);
      }
    } else {
      // Idle ambient drift — water ripples and canopy always subtly alive
      this.waterOffsetX = (this.waterOffsetX + 15 * s) % 400;
      this.treeOffsetX  = (this.treeOffsetX  + 4  * s) % 800;
    }

    this.drawRiverLayers();
    ambientSound.sync(this.state);
  }

  // ── River rendering ──────────────────────────────────────────────────────────

  private drawRiverLayers() {
    const viewW = this.scale.width - PANEL_W;
    const h     = this.scale.height;
    const SKY_H  = Math.floor(h * 0.22);
    const TREE_H = Math.floor(h * 0.13);
    const BANK_H = Math.floor(h * 0.18);
    const WATER_Y = SKY_H + TREE_H;
    const WATER_H = h - WATER_Y - BANK_H;

    this.drawSky(viewW, SKY_H);
    this.drawTrees(viewW, SKY_H, TREE_H);
    this.drawWater(viewW, WATER_Y, WATER_H);
    this.drawBank(viewW, h - BANK_H, BANK_H);
  }

  private drawSky(viewW: number, SKY_H: number) {
    this.skyGfx.clear();
    const SKY_COLORS: Record<string, number> = {
      dawn: 0x3d1c08, morning: 0x112030, afternoon: 0x0d1e2c, dusk: 0x3a1204, night: 0x020408,
    };
    this.skyGfx.fillStyle(SKY_COLORS[this.state.timeOfDay] ?? 0x0d1e2c, 1);
    this.skyGfx.fillRect(0, 0, viewW, SKY_H);

    if (this.state.timeOfDay === "dawn" || this.state.timeOfDay === "dusk") {
      const glow = this.state.timeOfDay === "dawn" ? 0xff6820 : 0xdd3008;
      // Lower horizon band — bright
      this.skyGfx.fillStyle(glow, 0.35);
      this.skyGfx.fillRect(0, Math.floor(SKY_H * 0.6), viewW, Math.floor(SKY_H * 0.4));
      // Upper horizon fade
      this.skyGfx.fillStyle(glow, 0.12);
      this.skyGfx.fillRect(0, Math.floor(SKY_H * 0.25), viewW, Math.floor(SKY_H * 0.35));
    }

    if (this.state.timeOfDay === "morning") {
      this.skyGfx.fillStyle(0x4090d0, 0.08);
      this.skyGfx.fillRect(0, 0, viewW, Math.floor(SKY_H * 0.5));
    }

    if (this.state.timeOfDay === "night") {
      this.skyGfx.fillStyle(0xd4c9a0, 0.8);
      for (let i = 0; i < 45; i++) {
        const sx = this.rng(this.state.dayNumber * 100 + i * 7.3) * viewW;
        const sy = this.rng(this.state.dayNumber * 100 + i * 13.7) * SKY_H * 0.85;
        this.skyGfx.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
      }
    }
  }

  private drawTrees(viewW: number, SKY_H: number, TREE_H: number) {
    this.treeGfx.clear();
    const TREE_BASE = SKY_H + TREE_H;

    // Mist band bridging sky and canopy
    this.treeGfx.fillStyle(0x152212, 1);
    this.treeGfx.fillRect(0, SKY_H - 4, viewW, TREE_H + 4);

    // Canopy silhouettes (tiled, scrolling at 0.25× speed)
    this.treeGfx.fillStyle(0x0e1e0c, 1);
    const PATTERN: [number, number, number][] = [
      [18, 42, 54], [82, 24, 38], [128, 48, 70], [200, 32, 50],
      [258, 56, 76], [338, 30, 46], [398, 44, 64], [462, 20, 36],
      [508, 58, 78], [588, 36, 54], [648, 28, 44], [698, 50, 68],
      [758, 24, 40], [798, 44, 60],
    ];
    for (let rep = -1; rep <= Math.ceil(viewW / 800) + 1; rep++) {
      for (const [tx, tw, th] of PATTERN) {
        const x = Math.floor(tx + rep * 800 - this.treeOffsetX);
        if (x + tw < 0 || x > viewW) continue;
        this.treeGfx.fillRect(x, TREE_BASE - th, tw, th);
        this.treeGfx.fillRect(
          x + Math.floor(tw / 2) - 1, TREE_BASE - Math.floor(th * 0.25),
          3, Math.floor(th * 0.25),
        );
      }
    }
  }

  private drawWater(viewW: number, WATER_Y: number, WATER_H: number) {
    this.waterGfx.clear();
    const base = this.state.timeOfDay === "night" ? 0x06101a : 0x0e2434;
    this.waterGfx.fillStyle(base, 1);
    this.waterGfx.fillRect(0, WATER_Y, viewW, WATER_H);

    // Reflection shimmer near tree line
    this.waterGfx.fillStyle(0x284858, 0.4);
    this.waterGfx.fillRect(0, WATER_Y, viewW, Math.floor(WATER_H * 0.15));

    // Flowing ripple lines
    const PALETTE = [0x1c3848, 0x224050, 0x162c38, 0x244258];
    for (let i = 0; i < 14; i++) {
      const y    = WATER_Y + Math.floor((i / 14) * WATER_H);
      const xOff = (this.waterOffsetX + i * 27) % 400;
      this.waterGfx.lineStyle(1, PALETTE[i % PALETTE.length], 0.45);
      let rx = -xOff;
      while (rx < viewW) {
        const segLen = 28 + (i * 19) % 52;
        this.waterGfx.beginPath();
        this.waterGfx.moveTo(rx, y);
        this.waterGfx.lineTo(rx + segLen, y + Math.floor(Math.sin(i) * 2));
        this.waterGfx.strokePath();
        rx += segLen + 18 + (i * 11) % 28;
      }
    }

    // Storm darkening
    if (this.state.weather === "storm") {
      this.waterGfx.fillStyle(0x020406, 0.35);
      this.waterGfx.fillRect(0, WATER_Y, viewW, WATER_H);
    } else if (this.state.weather === "storm_approaching") {
      this.waterGfx.fillStyle(0x020406, 0.18);
      this.waterGfx.fillRect(0, WATER_Y, viewW, WATER_H);
    }
  }

  private drawBank(viewW: number, BANK_Y: number, BANK_H: number) {
    this.bankGfx.clear();
    this.bankGfx.fillStyle(0x0c1409, 1);
    this.bankGfx.fillRect(0, BANK_Y, viewW, BANK_H);

    // Mud edge
    this.bankGfx.fillStyle(0x1a2a14, 1);
    this.bankGfx.fillRect(0, BANK_Y, viewW, 7);

    // Grass tufts (tiled, scrolling at 1.6× speed)
    this.bankGfx.fillStyle(0x243a1c, 1);
    const BASES = [30, 85, 150, 215, 290, 360, 430, 510, 580];
    for (const base of BASES) {
      for (let rep = -1; rep <= Math.ceil(viewW / 600) + 1; rep++) {
        const x = Math.floor(base + rep * 600 - this.bankOffsetX);
        if (x < -20 || x > viewW + 20) continue;
        this.bankGfx.fillRect(x,      BANK_Y - 5, 3, 8);
        this.bankGfx.fillRect(x + 6,  BANK_Y - 7, 3, 10);
        this.bankGfx.fillRect(x + 12, BANK_Y - 4, 3, 7);
      }
    }
  }

  // ── Navigation panel ─────────────────────────────────────────────────────────

  private renderLocationPanel() {
    const { width } = this.scale;
    const PAD = 20;
    const PX  = width - PANEL_W + PAD;

    this.navContainer.removeAll(true);
    if (this.movementState === "TRAVELING") return;

    const node = this.runNodes.find((n) => n.id === this.state.currentNodeId);
    if (!node) return;

    let y = 28;

    // ── Location name ────────────────────────────────────────────────────
    const nameText = this.add.text(PX, y, node.name, {
      fontSize: "18px", color: "#f5c842", fontFamily: "Georgia, serif",
      fontStyle: "italic", wordWrap: { width: PANEL_W - PAD * 2 },
    }).setOrigin(0, 0);
    this.navContainer.add(nameText);
    y += nameText.height + 4;

    // ── Type and region ──────────────────────────────────────────────────
    const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    const typeText  = this.add.text(PX, y, `${typeLabel}  ·  ${node.region}`, {
      fontSize: "11px", color: "#6b5a34", fontFamily: "Georgia, serif",
    }).setOrigin(0, 0);
    this.navContainer.add(typeText);
    y += typeText.height + 6;

    // ── World memory ─────────────────────────────────────────────────────
    const mem = this.state.derivedState.nodes[node.id];
    if (mem && mem.visit_count > 0) {
      const vt = this.add.text(PX, y, `Visit ${mem.visit_count + 1}`, {
        fontSize: "10px", color: "#4a9ade", fontFamily: "Georgia, serif", fontStyle: "italic",
      }).setOrigin(0, 0);
      this.navContainer.add(vt);
      y += vt.height + 2;

      if (mem.has_medical_history) {
        const mt = this.add.text(PX, y, "◆ Medical history", {
          fontSize: "10px", color: "#a8c89a", fontFamily: "Georgia, serif",
        }).setOrigin(0, 0);
        this.navContainer.add(mt);
        y += mt.height + 2;
      }
      if (Math.abs(mem.community_trust) > 0.5) {
        const sign = mem.community_trust > 0 ? "+" : "";
        const col  = mem.community_trust > 0 ? "#6ab04c" : "#c84040";
        const tt   = this.add.text(PX, y, `Trust ${sign}${mem.community_trust.toFixed(1)}`, {
          fontSize: "10px", color: col, fontFamily: "Georgia, serif",
        }).setOrigin(0, 0);
        this.navContainer.add(tt);
        y += tt.height + 2;
      }
    }

    y += 10;
    this.addDivider(PX, y, PANEL_W - PAD * 2);
    y += 14;

    // ── Location hint ────────────────────────────────────────────────────
    if (node.hint) {
      const ht = this.add.text(PX, y, node.hint, {
        fontSize: "11px", color: "#7a6a4a", fontFamily: "Georgia, serif",
        fontStyle: "italic", wordWrap: { width: PANEL_W - PAD * 2 }, lineSpacing: 3,
      }).setOrigin(0, 0);
      this.navContainer.add(ht);
      y += ht.height + 10;
    }

    // ── Explore button ───────────────────────────────────────────────────
    const encounter = selectEncounter(node, this.state);
    if (encounter) {
      const exploreBtn = this.add.text(PX, y, "[ Explore ]", {
        fontSize: "14px", color: "#a8c89a", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => exploreBtn.setColor("#f5c842"))
        .on("pointerout",  () => exploreBtn.setColor("#a8c89a"))
        .on("pointerdown", () => {
          this.scene.launch("EncounterScene", { node: encounter, state: this.state });
          this.scene.pause("MapScene");
        });
      this.navContainer.add(exploreBtn);
      y += exploreBtn.height + 16;
    }

    // ── Expedition complete ──────────────────────────────────────────────
    if (node.id === "destination") {
      const endBtn = this.add.text(PX, y, "→ Complete Expedition", {
        fontSize: "14px", color: "#f5c842", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => endBtn.setColor("#ffffff"))
        .on("pointerout",  () => endBtn.setColor("#f5c842"))
        .on("pointerdown", () => {
          this.scene.stop("UIScene");
          this.scene.start("RunEndScene", { state: this.state, reason: "destination" });
        });
      this.navContainer.add(endBtn);
      return;
    }

    // ── Navigation destinations ──────────────────────────────────────────
    this.addDivider(PX, y, PANEL_W - PAD * 2);
    y += 14;

    const hdr = this.add.text(PX, y, "CONTINUE TO:", {
      fontSize: "9px", color: "#4a3820", fontFamily: "Georgia, serif", letterSpacing: 3,
    }).setOrigin(0, 0);
    this.navContainer.add(hdr);
    y += hdr.height + 10;

    const ICONS: Record<string, string> = {
      town: "⌂", settlement: "◈", wildlife: "◉",
      discovery: "✦", navigation: "⬡", story: "★",
    };
    const TYPE_COLORS: Record<string, string> = {
      town: "#e8a020", settlement: "#c8945a", wildlife: "#6ab04c",
      discovery: "#f5c842", navigation: "#4a9ade", story: "#e84040",
    };

    for (const dest of this.adjacentNodes(this.state.currentNodeId)) {
      const visited      = this.state.visitedNodeIds.has(dest.id);
      const hasIntel     = this.state.radioTipNodeIds.has(dest.id);
      const destMem      = this.state.derivedState.nodes[dest.id];
      const label        = `${ICONS[dest.type] ?? "→"}  ${dest.name}${visited ? " ✓" : ""}`;
      const col          = visited ? "#4a3820" : (TYPE_COLORS[dest.type] ?? "#a09070");

      const destBtn = this.add.text(PX, y, label, {
        fontSize: "13px", color: col, fontFamily: "Georgia, serif",
        wordWrap: { width: PANEL_W - PAD * 2 },
      }).setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => destBtn.setColor("#ffffff"))
        .on("pointerout",  () => destBtn.setColor(col))
        .on("pointerdown", () => this.travelTo(dest.id));
      this.navContainer.add(destBtn);
      y += destBtn.height + 2;

      if (hasIntel) {
        const it = this.add.text(PX + 16, y, "📻 Radio intel", {
          fontSize: "9px", color: "#7a9aaa", fontFamily: "Georgia, serif", fontStyle: "italic",
        }).setOrigin(0, 0);
        this.navContainer.add(it);
        y += it.height + 2;
      }

      if (destMem && destMem.visit_count > 0) {
        const pvt = this.add.text(PX + 16, y, `Visit ${destMem.visit_count + 1}`, {
          fontSize: "9px", color: "#3a3020", fontFamily: "Georgia, serif", fontStyle: "italic",
        }).setOrigin(0, 0);
        this.navContainer.add(pvt);
        y += pvt.height + 2;
      }

      y += 6;
    }
  }

  // ── Travel ───────────────────────────────────────────────────────────────────

  private travelTo(destId: string) {
    if (this.movementState !== "STOPPED") return;
    const destNode = this.runNodes.find((n) => n.id === destId);
    this.pendingDestId    = destId;
    this.movementState    = "TRAVELING";
    this.travelElapsed    = 0;
    this.navContainer.setVisible(false);
    this.travelText.setText(`→ ${destNode?.name ?? destId}`).setAlpha(1);
  }

  private completeTravelTo(destId: string) {
    this.movementState = "STOPPED";
    this.pendingDestId = null;
    this.navContainer.setVisible(true);
    this.travelText.setAlpha(0);

    this.state.visitNode(destId);
    this.state.advanceTime();
    this.state.drainResources({ fuel: 10, food: 5 });

    const runEnded = this.crisis.check((reason) => {
      this.scene.stop("UIScene");
      this.scene.start("RunEndScene", { state: this.state, reason });
    });
    if (runEnded) return;

    if (destId === "destination") {
      this.scene.stop("UIScene");
      this.scene.start("RunEndScene", { state: this.state, reason: "destination" });
      return;
    }

    this.renderLocationPanel();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private adjacentNodes(nodeId: string): RiverNode[] {
    const adjIds = this.runEdges
      .filter((e) => e.from === nodeId || e.to === nodeId)
      .map((e) => (e.from === nodeId ? e.to : e.from));
    return this.runNodes.filter((n) => adjIds.includes(n.id));
  }

  private addDivider(x: number, y: number, w: number) {
    this.navContainer.add(
      this.add.rectangle(x + w / 2, y, w, 1, 0x2a1e08).setOrigin(0.5),
    );
  }

  private rng(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}
