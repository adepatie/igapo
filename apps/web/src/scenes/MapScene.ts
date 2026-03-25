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

  // Perspective scroll offset (0–1, drives all river animation)
  // Advances fast during travel, slow when idle (ambient current)
  private perspectiveScroll = 0;

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

    // River view layers — perspective ordering:
    //   sky(0) → banks(1) → water(2) → trees(3, overlaps sky at horizon)
    this.skyGfx   = this.add.graphics().setDepth(0);
    this.bankGfx  = this.add.graphics().setDepth(1);
    this.waterGfx = this.add.graphics().setDepth(2);
    this.treeGfx  = this.add.graphics().setDepth(3);

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
      // Fast scroll — things rush past during travel
      this.perspectiveScroll = (this.perspectiveScroll + 1.6 * s) % 1;
      if (this.travelElapsed >= TRAVEL_MS) {
        this.completeTravelTo(this.pendingDestId!);
      }
    } else {
      // Slow ambient current — river is always alive
      this.perspectiveScroll = (this.perspectiveScroll + 0.06 * s) % 1;
    }
    this.drawRiverLayers();
    ambientSound.sync(this.state);
  }

  // ── River rendering ──────────────────────────────────────────────────────────

  private drawRiverLayers() {
    const W   = this.scale.width - PANEL_W;
    const H   = this.scale.height;
    // Vanishing point — centre of view, 30% down
    const vpX = W / 2;
    const vpY = Math.floor(H * 0.30);
    // River bank edges at the bottom of the screen
    const lBot = Math.floor(W * 0.10);   // left water/bank boundary
    const rBot = Math.floor(W * 0.90);   // right water/bank boundary

    this.drawSky(W, H, vpX, vpY);
    this.drawBanks(W, H, vpX, vpY, lBot, rBot);
    this.drawWater(W, H, vpX, vpY, lBot, rBot);
    this.drawTrees(W, H, vpX, vpY, lBot, rBot);
  }

  private drawSky(W: number, _H: number, _vpX: number, vpY: number) {
    this.skyGfx.clear();
    const SKY_COLORS: Record<string, number> = {
      dawn: 0x3d1c08, morning: 0x112030, afternoon: 0x0d1e2c, dusk: 0x3a1204, night: 0x020408,
    };
    this.skyGfx.fillStyle(SKY_COLORS[this.state.timeOfDay] ?? 0x0d1e2c, 1);
    this.skyGfx.fillRect(0, 0, W, vpY + 4); // +4 covers seam with banks/water

    if (this.state.timeOfDay === "dawn" || this.state.timeOfDay === "dusk") {
      const glow = this.state.timeOfDay === "dawn" ? 0xff6820 : 0xdd3008;
      // Bright band right at the horizon
      this.skyGfx.fillStyle(glow, 0.50);
      this.skyGfx.fillRect(0, vpY - 14, W, 14);
      // Fade above the horizon
      this.skyGfx.fillStyle(glow, 0.22);
      this.skyGfx.fillRect(0, vpY - 48, W, 34);
      this.skyGfx.fillStyle(glow, 0.08);
      this.skyGfx.fillRect(0, vpY - 90, W, 42);
    }

    if (this.state.timeOfDay === "morning") {
      this.skyGfx.fillStyle(0x4090d0, 0.10);
      this.skyGfx.fillRect(0, 0, W, Math.floor(vpY * 0.6));
    }

    if (this.state.timeOfDay === "night") {
      this.skyGfx.fillStyle(0xd4c9a0, 0.8);
      for (let i = 0; i < 55; i++) {
        const sx = this.rng(this.state.dayNumber * 100 + i * 7.3) * W;
        const sy = this.rng(this.state.dayNumber * 100 + i * 13.7) * (vpY - 8);
        this.skyGfx.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
      }
    }
  }

  // Draws perspective canopy silhouettes on both river banks.
  // Trees are placed at depth fractions driven by perspectiveScroll —
  // tiny at the horizon, full-height (and off-screen) near the viewer.
  private drawTrees(W: number, H: number, vpX: number, vpY: number, lBot: number, rBot: number) {
    this.treeGfx.clear();
    const tod = this.state.timeOfDay;
    const canopy = (tod === "night") ? 0x060c05 : 0x0e1e0c;

    // 13 tree slots evenly distributed across the 0–1 depth range
    const SLOTS  = [0.03, 0.11, 0.19, 0.27, 0.35, 0.43, 0.51, 0.59, 0.67, 0.75, 0.83, 0.91, 0.97];
    // Width multiplier per slot adds variety
    const W_MULT = [1.0,  0.7,  1.3,  0.85, 1.1,  0.75, 1.2,  0.9,  1.0,  0.8,  1.15, 0.95, 1.05];

    for (let i = 0; i < SLOTS.length; i++) {
      const f = (SLOTS[i] + this.perspectiveScroll) % 1;
      if (f < 0.015) continue; // skip trees right at horizon — too small to see

      // Perspective position along bank-edge lines
      const bankY  = vpY + f * (H - vpY);
      const lEdgeX = vpX - f * (vpX - lBot);  // where left bank meets water
      const rEdgeX = vpX + f * (rBot - vpX);  // where right bank meets water

      // Height: linear in f so trees reach into the sky even at medium depth
      const treeH = f * H * 0.72;
      const treeW = Math.max(2, f * 52 * W_MULT[i]);
      const alpha = Math.min(1, f * 2.5); // fade in softly from horizon

      this.treeGfx.fillStyle(canopy, alpha);
      // Left tree — grows leftward from the bank edge
      this.treeGfx.fillRect(lEdgeX - treeW, bankY - treeH, treeW, treeH);
      // Right tree — grows rightward from the bank edge
      this.treeGfx.fillRect(rEdgeX, bankY - treeH, treeW, treeH);
    }
  }

  // Draws the river as a perspective triangle (banks converge to vanishing point).
  // Ripple lines scroll down from the horizon, growing wider as they approach.
  private drawWater(W: number, H: number, vpX: number, vpY: number, lBot: number, rBot: number) {
    this.waterGfx.clear();
    const tod  = this.state.timeOfDay;
    const base = tod === "night" ? 0x06101a : 0x0e2434;

    // River surface triangle
    this.waterGfx.fillStyle(base, 1);
    this.waterGfx.fillTriangle(lBot, H, rBot, H, vpX, vpY);

    // Horizon reflection shimmer (narrow bright band at the vanishing point)
    this.waterGfx.fillStyle(0x284858, 0.25);
    this.waterGfx.fillTriangle(
      vpX - 40, vpY + 30, vpX + 40, vpY + 30, vpX, vpY,
    );

    // Perspective ripple lines — scroll toward the viewer from the horizon
    const PALETTE = [0x1c3848, 0x224050, 0x162c38, 0x244258];
    const N = 22;
    for (let i = 0; i < N; i++) {
      const f = ((i / N) + this.perspectiveScroll) % 1;
      const yR = vpY + f * (H - vpY);
      const lx = vpX - f * (vpX - lBot);
      const rx = vpX + f * (rBot - vpX);
      const alpha = 0.08 + f * 0.38; // faint near horizon, strong up close
      this.waterGfx.lineStyle(1, PALETTE[i % PALETTE.length], alpha);
      this.waterGfx.beginPath();
      this.waterGfx.moveTo(lx, yR);
      this.waterGfx.lineTo(rx, yR);
      this.waterGfx.strokePath();
    }

    // Storm darkening
    if (this.state.weather === "storm") {
      this.waterGfx.fillStyle(0x020406, 0.40);
      this.waterGfx.fillTriangle(lBot, H, rBot, H, vpX, vpY);
    } else if (this.state.weather === "storm_approaching") {
      this.waterGfx.fillStyle(0x020406, 0.20);
      this.waterGfx.fillTriangle(lBot, H, rBot, H, vpX, vpY);
    }
  }

  // Draws the left and right forest banks as triangles converging to the VP.
  private drawBanks(W: number, H: number, vpX: number, vpY: number, lBot: number, rBot: number) {
    this.bankGfx.clear();
    const tod    = this.state.timeOfDay;
    const forest = tod === "night" ? 0x060d05 : 0x0c1a09;

    // Left bank triangle: outer-left corner, inner water edge, vanishing point
    this.bankGfx.fillStyle(forest, 1);
    this.bankGfx.fillTriangle(0, H, lBot, H, vpX, vpY);

    // Right bank triangle: inner water edge, outer-right corner, vanishing point
    this.bankGfx.fillTriangle(rBot, H, W, H, vpX, vpY);

    // Subtle lighter strip along the water/bank boundary lines (mud/beach)
    this.bankGfx.lineStyle(3, tod === "night" ? 0x0a1808 : 0x162a10, 1);
    this.bankGfx.beginPath();
    this.bankGfx.moveTo(lBot, H);
    this.bankGfx.lineTo(vpX, vpY);
    this.bankGfx.strokePath();
    this.bankGfx.beginPath();
    this.bankGfx.moveTo(rBot, H);
    this.bankGfx.lineTo(vpX, vpY);
    this.bankGfx.strokePath();
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

    // ── Continue down river ──────────────────────────────────────────────
    // Adjacent nodes are shown as directional choices — names/types are only
    // revealed if the player has visited before or has radio intel on them.
    const forward = this.forwardNodes(this.state.currentNodeId);
    if (forward.length === 0) return; // dead end (shouldn't happen outside destination)

    this.addDivider(PX, y, PANEL_W - PAD * 2);
    y += 14;

    const DIRECTION_LABELS = ["Continue down river", "Branch — left channel", "Branch — right channel"];
    const TYPE_COLORS: Record<string, string> = {
      town: "#e8a020", settlement: "#c8945a", wildlife: "#6ab04c",
      discovery: "#f5c842", navigation: "#4a9ade", story: "#e84040",
    };
    const ICONS: Record<string, string> = {
      town: "⌂", settlement: "◈", wildlife: "◉",
      discovery: "✦", navigation: "⬡", story: "★",
    };

    forward.forEach((dest, idx) => {
      const visited  = this.state.visitedNodeIds.has(dest.id);
      const hasIntel = this.state.radioTipNodeIds.has(dest.id);
      const revealed = visited || hasIntel;

      // Label — only show name/type if known
      let label: string;
      let col: string;
      if (revealed) {
        label = `${ICONS[dest.type] ?? "→"}  ${dest.name}${visited ? "  ✓" : ""}`;
        col   = visited ? "#4a3820" : (TYPE_COLORS[dest.type] ?? "#a09070");
      } else {
        // Unknown destination: directional label only
        label = `→  ${DIRECTION_LABELS[idx] ?? "Continue →"}`;
        col   = "#6a5a3a";
      }

      const btn = this.add.text(PX, y, label, {
        fontSize: "13px", color: col, fontFamily: "Georgia, serif",
        wordWrap: { width: PANEL_W - PAD * 2 },
      }).setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => btn.setColor("#ffffff"))
        .on("pointerout",  () => btn.setColor(col))
        .on("pointerdown", () => this.travelTo(dest.id));
      this.navContainer.add(btn);
      y += btn.height + 2;

      if (hasIntel && !visited) {
        const it = this.add.text(PX + 16, y, "📻 Radio intel", {
          fontSize: "9px", color: "#7a9aaa", fontFamily: "Georgia, serif", fontStyle: "italic",
        }).setOrigin(0, 0);
        this.navContainer.add(it);
        y += it.height + 2;
      }

      y += 6;
    });
  }

  // ── Travel ───────────────────────────────────────────────────────────────────

  private travelTo(destId: string) {
    if (this.movementState !== "STOPPED") return;
    const destNode = this.runNodes.find((n) => n.id === destId);
    this.pendingDestId    = destId;
    this.movementState    = "TRAVELING";
    this.travelElapsed    = 0;
    this.navContainer.setVisible(false);
    // Only reveal the destination name if already visited or has intel
    const knownDest = this.state.visitedNodeIds.has(destId) || this.state.radioTipNodeIds.has(destId);
    const travelLabel = knownDest ? `→ ${destNode?.name ?? destId}` : "Traveling down river…";
    this.travelText.setText(travelLabel).setAlpha(1);
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

  // Returns adjacent nodes that are "forward" — i.e. not already visited,
  // except the destination which is always shown once reached.
  // This hides the graph: players navigate blind unless they've been there
  // before or have radio intel.
  private forwardNodes(nodeId: string): RiverNode[] {
    return this.adjacentNodes(nodeId).filter(
      (n) => !this.state.visitedNodeIds.has(n.id) || n.id === "destination",
    );
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
