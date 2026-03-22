import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { FieldJournal } from "./FieldJournal";

const BAR_W = 80;
const BAR_H = 7;

const RESOURCE_COLORS: Record<string, number> = {
  fuel: 0xe8a020,
  food: 0x6ab04c,
  medicine: 0x4a9ade,
  equipment: 0xa084ca,
  morale: 0xe84040,
};

const RESOURCE_LABELS = ["fuel", "food", "medicine", "equipment", "morale"] as const;

export class ResourceHUD {
  private scene: Phaser.Scene;
  private state: GameState;
  private journal: FieldJournal;
  private bars: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private timeText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private crewLabels: Phaser.GameObjects.Text[] = [];
  private journalBtn!: Phaser.GameObjects.Text;
  private noteCount!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
    this.journal = new FieldJournal(scene, state);
  }

  create() {
    const { width, height } = this.scene.scale;
    const pad = 14;
    const rowH = 20;
    const panelH = RESOURCE_LABELS.length * rowH + 20;

    // ── Resource panel ───────────────────────────────────────────────────
    this.scene.add.rectangle(pad + 95, pad + panelH / 2, 200, panelH, 0x0d0a06, 0.82)
      .setStrokeStyle(1, 0x2a1e08);

    RESOURCE_LABELS.forEach((key, i) => {
      const y = pad + 10 + i * rowH;

      this.scene.add.text(pad + 6, y, key.charAt(0).toUpperCase() + key.slice(1), {
        fontSize: "10px", color: "#8a7a52", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0.5);

      this.scene.add.rectangle(pad + 74, y, BAR_W, BAR_H, 0x1e1a10).setOrigin(0, 0.5);

      const fill = this.scene.add.rectangle(pad + 74, y, BAR_W, BAR_H, RESOURCE_COLORS[key], 1).setOrigin(0, 0.5);
      this.bars.set(key, fill);
    });

    // ── Time / Day (top right) ───────────────────────────────────────────
    this.timeText = this.scene.add.text(width - 14, 14, "", {
      fontSize: "13px", color: "#e8d5a3", fontFamily: "Georgia, serif",
    }).setOrigin(1, 0);

    this.dayText = this.scene.add.text(width - 14, 32, "", {
      fontSize: "10px", color: "#8a7a52", fontFamily: "Georgia, serif",
    }).setOrigin(1, 0);

    this.scene.add.text(width - 14, 50, `Season: ${this.state.season}`, {
      fontSize: "10px", color: "#6b5a34", fontFamily: "Georgia, serif",
    }).setOrigin(1, 0);

    // ── Crew panel (bottom left) ─────────────────────────────────────────
    const crewY = height - 76;
    this.scene.add.rectangle(pad + 90, crewY + 18, 192, 52, 0x0d0a06, 0.8)
      .setStrokeStyle(1, 0x2a1e08);
    this.scene.add.text(pad + 6, crewY + 4, "CREW", {
      fontSize: "9px", color: "#4a3820", fontFamily: "Georgia, serif", letterSpacing: 3,
    }).setOrigin(0, 0.5);

    this.state.crew.forEach((member, i) => {
      const y = crewY + 18 + i * 16;
      const label = this.scene.add.text(pad + 6, y, `${member.name}  —  ${member.role}`, {
        fontSize: "10px", color: "#a09070", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0.5);
      const traitLabel = this.scene.add.text(pad + 6, y + 10, member.traits.map(t => t.label).join(" · "), {
        fontSize: "9px", color: "#5a4a2a", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0.5);
      this.crewLabels.push(label, traitLabel);
    });

    // ── Journal button (bottom right) ────────────────────────────────────
    this.journalBtn = this.scene.add.text(width - 14, height - 20, "Field Journal [J]", {
      fontSize: "12px", color: "#6b5a34", fontFamily: "Georgia, serif", fontStyle: "italic",
    }).setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.journalBtn.setColor("#f5c842"))
      .on("pointerout", () => this.noteCount.text.includes("0")
        ? this.journalBtn.setColor("#6b5a34")
        : this.journalBtn.setColor("#a09070"))
      .on("pointerdown", () => {
        this.journal.toggle();
        this.journal.refreshNotes();
      });

    this.noteCount = this.scene.add.text(width - 14, height - 36, "", {
      fontSize: "10px", color: "#f5c842", fontFamily: "Georgia, serif",
    }).setOrigin(1, 1);

    // ── Field Journal panel ──────────────────────────────────────────────
    this.journal.create();
  }

  update() {
    const { resources } = this.state;

    for (const [key, bar] of this.bars) {
      const pct = resources[key as keyof typeof resources] / 100;
      bar.setScale(Math.max(0.01, pct), 1);
    }

    const tod = this.state.timeOfDay.charAt(0).toUpperCase() + this.state.timeOfDay.slice(1);
    this.timeText.setText(tod);
    this.dayText.setText(`Day ${this.state.dayNumber}`);

    const n = this.state.fieldNotes.length;
    this.noteCount.setText(n > 0 ? `${n} note${n !== 1 ? "s" : ""}` : "");
    this.journalBtn.setColor(n > 0 ? "#a09070" : "#6b5a34");
  }
}
