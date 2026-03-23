import Phaser from "phaser";
import { ARCHETYPES } from "@igapo/shared";
import type { Archetype } from "@igapo/shared";
import { Codex } from "../systems/Codex";

const CARD_W = 220;
const CARD_H = 310;
const CARD_GAP = 28;

const RESOURCE_LABELS: [string, string][] = [
  ["fuel", "Fuel"],
  ["food", "Food"],
  ["medicine", "Medicine"],
  ["equipment", "Equipment"],
  ["morale", "Morale"],
];

const MECHANIC_NAMES: Record<string, string> = {
  naturalist:   "Specimen Journal",
  correspondent: "Source Network",
  river_guide:  "Navigator's Eye",
  medic:        "Clinic Reputation",
};

const MECHANIC_DESC: Record<string, string> = {
  naturalist:   "Every 3 wildlife specimens trigger grant funding (+resources).",
  correspondent: "Human encounters generate radio intelligence on nearby nodes.",
  river_guide:  "Fog of war lifts two nodes deep instead of one.",
  medic:        "Offer clinics at settlements — communities remember you.",
};

export class ArchetypeScene extends Phaser.Scene {
  private selectedId: string | null = null;
  private cards: Map<string, Phaser.GameObjects.Container> = new Map();
  private beginBtn!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "ArchetypeScene" });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(cx, height / 2, width, height, 0x0d0a06);

    this.add.text(cx, 38, "Choose Your Archetype", {
      fontSize: "22px",
      color: "#f5c842",
      fontFamily: "Georgia, serif",
    }).setOrigin(0.5);

    this.add.text(cx, 66, "Your background shapes your knowledge, your resources, and the choices available to you.", {
      fontSize: "12px",
      color: "#7a8c6a",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
    }).setOrigin(0.5);

    // Season forecast
    const runCount = Codex.load().totalRuns;
    const expectedSeason = (runCount % 2 === 0) ? "wet" : "dry";
    const seasonColor = expectedSeason === "wet" ? "#4a8cba" : "#c8a84a";
    const seasonLabel = expectedSeason === "wet" ? "Wet Season" : "Dry Season";
    const seasonNote = expectedSeason === "wet"
      ? "Rivers high · Forests flooded · Dolphins deep inland · Higher fuel drain"
      : "Rivers low · Sandbars exposed · Piranhas concentrated · Resupply costs more";
    this.add.text(cx, 94, `Expected: ${seasonLabel}`, {
      fontSize: "12px", color: seasonColor, fontFamily: "Georgia, serif", letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(cx, 112, seasonNote, {
      fontSize: "10px", color: "#4a3820", fontFamily: "Georgia, serif", fontStyle: "italic",
    }).setOrigin(0.5);

    const totalW = ARCHETYPES.length * CARD_W + (ARCHETYPES.length - 1) * CARD_GAP;
    const startX = cx - totalW / 2 + CARD_W / 2;

    ARCHETYPES.forEach((arch, i) => {
      const x = startX + i * (CARD_W + CARD_GAP);
      const card = this.buildCard(arch, x, height / 2 + 20);
      this.cards.set(arch.id, card);
    });

    // Begin button (disabled until selection)
    this.beginBtn = this.add.text(cx, height - 52, "Select an archetype to begin", {
      fontSize: "16px",
      color: "#3d4d32",
      fontFamily: "Georgia, serif",
    }).setOrigin(0.5);
  }

  private buildCard(arch: Archetype, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x13100a)
      .setStrokeStyle(1, 0x3d2e0a);
    container.add(bg);

    // Name
    const nameText = this.add.text(0, -CARD_H / 2 + 20, arch.name, {
      fontSize: "15px",
      color: "#f5c842",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      wordWrap: { width: CARD_W - 24 },
      align: "center",
    }).setOrigin(0.5, 0);
    container.add(nameText);

    // Divider
    const div = this.add.rectangle(0, -CARD_H / 2 + 50, CARD_W - 32, 1, 0x3d2e0a);
    container.add(div);

    // Background text
    const bg2 = this.add.text(0, -CARD_H / 2 + 62, arch.background, {
      fontSize: "11px",
      color: "#a09070",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      wordWrap: { width: CARD_W - 24 },
      align: "left",
      lineSpacing: 4,
    }).setOrigin(0.5, 0);
    container.add(bg2);

    // Resource bars
    const barStartY = CARD_H / 2 - 115;
    RESOURCE_LABELS.forEach(([key, label], i) => {
      const rowY = barStartY + i * 18;
      const val = (arch.startingResources as Record<string, number>)[key] ?? 80;
      const pct = val / 100;

      const lbl = this.add.text(-CARD_W / 2 + 12, rowY, label, {
        fontSize: "10px",
        color: "#8a7a52",
        fontFamily: "Georgia, serif",
      }).setOrigin(0, 0.5);
      container.add(lbl);

      const barBg = this.add.rectangle(CARD_W / 2 - 52, rowY, 72, 5, 0x2a2010).setOrigin(0, 0.5);
      container.add(barBg);

      const barFill = this.add.rectangle(CARD_W / 2 - 52, rowY, 72 * pct, 5, 0x6ab04c).setOrigin(0, 0.5);
      container.add(barFill);
    });

    // Unique mechanic label
    const mechName = MECHANIC_NAMES[arch.id];
    if (mechName) {
      const mechLabel = this.add.text(0, CARD_H / 2 - 52, mechName, {
        fontSize: "10px",
        color: "#c8a84a",
        fontFamily: "Georgia, serif",
        letterSpacing: 1,
      }).setOrigin(0.5, 1);
      container.add(mechLabel);

      const mechDesc = this.add.text(0, CARD_H / 2 - 38, MECHANIC_DESC[arch.id] ?? "", {
        fontSize: "9px",
        color: "#6b5a34",
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        wordWrap: { width: CARD_W - 24 },
        align: "center",
      }).setOrigin(0.5, 1);
      container.add(mechDesc);
    }

    // Bonus note
    if (arch.bonusFieldNoteIds.length > 0) {
      const bonus = this.add.text(0, CARD_H / 2 - 8, "✦ Starts with a Field Note", {
        fontSize: "10px",
        color: "#f5c842",
        fontFamily: "Georgia, serif",
      }).setOrigin(0.5, 1);
      container.add(bonus);
    }

    // Hit area
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      if (this.selectedId !== arch.id) bg.setStrokeStyle(1, 0x8a7a52);
    });
    bg.on("pointerout", () => {
      if (this.selectedId !== arch.id) bg.setStrokeStyle(1, 0x3d2e0a);
    });
    bg.on("pointerdown", () => this.selectArchetype(arch));

    return container;
  }

  private selectArchetype(arch: Archetype) {
    this.selectedId = arch.id;

    // Update all card borders
    for (const [id, card] of this.cards) {
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(id === arch.id ? 2 : 1, id === arch.id ? 0xf5c842 : 0x3d2e0a);
    }

    this.beginBtn
      .setText(`Begin as ${arch.name} →`)
      .setColor("#a8c89a")
      .setInteractive({ useHandCursor: true })
      .off("pointerdown")
      .on("pointerover", () => this.beginBtn.setColor("#f5c842"))
      .on("pointerout", () => this.beginBtn.setColor("#a8c89a"))
      .on("pointerdown", () => this.startRun(arch));
  }

  private startRun(arch: Archetype) {
    this.scene.start("MapScene", { archetypeId: arch.id });
  }
}
