import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { Codex } from "../systems/Codex";

interface RunEndData {
  state: GameState;
  reason?: "destination" | "fuel" | "food" | "morale";
}

export class RunEndScene extends Phaser.Scene {
  private state!: GameState;
  private reason!: string;

  constructor() {
    super({ key: "RunEndScene" });
  }

  init(data: RunEndData) {
    this.state = data.state;
    this.reason = data.reason ?? "destination";

    // Persist codex entries
    Codex.recordRun(this.state);
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(cx, height / 2, width, height, 0x060402);

    const reached = this.reason === "destination";

    // Header
    this.add.text(cx, 60, reached ? "Expedition Complete" : "Expedition Ended", {
      fontSize: "28px",
      color: reached ? "#f5c842" : "#c84040",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
    }).setOrigin(0.5);

    const subtitle = {
      destination: "You reached the station. The river gave you what it chose to give.",
      fuel: "The engine died somewhere no one comes. The expedition ends here.",
      food: "The crew could not continue. The river asks more than you had.",
      morale: "The crew dispersed at the last stop. Some expeditions end before they end.",
    }[this.reason] ?? "";

    this.add.text(cx, 100, subtitle, {
      fontSize: "13px",
      color: "#7a6a48",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      wordWrap: { width: 700 },
      align: "center",
    }).setOrigin(0.5);

    // Divider
    this.add.rectangle(cx, 128, 700, 1, 0x3d2e0a);

    // Two-column summary
    this.drawResourceSummary(cx - 200, 160);
    this.drawFieldNotes(cx + 80, 160);

    // Crew summary
    this.drawCrewSummary(cx, 430);

    // Codex progress
    const codexCount = Codex.load().totalNotes;
    this.add.text(cx, 510, `Field Journal across all runs: ${codexCount} note${codexCount !== 1 ? "s" : ""} documented.`, {
      fontSize: "12px",
      color: "#5a4a2a",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
    }).setOrigin(0.5);

    // Meta fragment hint
    const fragments = Codex.load().metaFragments;
    if (fragments.length > 0) {
      this.add.text(cx, 532, `Zona Silenciosa fragments: ${fragments.length} / 8`, {
        fontSize: "11px",
        color: reached ? "#c84040" : "#3a2a1a",
        fontFamily: "Georgia, serif",
        letterSpacing: 2,
      }).setOrigin(0.5);
    }

    // Divider
    this.add.rectangle(cx, 560, 700, 1, 0x3d2e0a);

    // Actions
    const newRunBtn = this.add.text(cx - 80, 598, "New Expedition →", {
      fontSize: "16px", color: "#a8c89a", fontFamily: "Georgia, serif",
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => newRunBtn.setColor("#f5c842"))
      .on("pointerout", () => newRunBtn.setColor("#a8c89a"))
      .on("pointerdown", () => this.scene.start("ArchetypeScene"));

    const titleBtn = this.add.text(cx + 120, 598, "← Title", {
      fontSize: "14px", color: "#5a4a2a", fontFamily: "Georgia, serif",
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => titleBtn.setColor("#a09070"))
      .on("pointerout", () => titleBtn.setColor("#5a4a2a"))
      .on("pointerdown", () => this.scene.start("TitleScene"));
  }

  private drawResourceSummary(x: number, startY: number) {
    this.add.text(x, startY, "Resources at end", {
      fontSize: "11px", color: "#5a4a2a", fontFamily: "Georgia, serif", letterSpacing: 3,
    }).setOrigin(0.5, 0);

    const bars: [string, number][] = [
      ["Fuel", this.state.resources.fuel],
      ["Food", this.state.resources.food],
      ["Medicine", this.state.resources.medicine],
      ["Equipment", this.state.resources.equipment],
      ["Morale", this.state.resources.morale],
    ];

    bars.forEach(([label, val], i) => {
      const y = startY + 22 + i * 24;
      const pct = val / 100;
      const color = pct > 0.5 ? "#6ab04c" : pct > 0.2 ? "#e8a020" : "#c84040";

      this.add.text(x - 80, y, label, {
        fontSize: "11px", color: "#8a7a52", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0.5);

      this.add.rectangle(x + 10, y, 100, 7, 0x1e1a10).setOrigin(0, 0.5);
      this.add.rectangle(x + 10, y, 100 * pct, 7, parseInt(color.slice(1), 16)).setOrigin(0, 0.5);
      this.add.text(x + 116, y, `${Math.round(val)}`, {
        fontSize: "10px", color: "#5a4a2a", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0.5);
    });

    // Days elapsed
    this.add.text(x, startY + 22 + 5 * 24 + 10, `${this.state.dayNumber} day${this.state.dayNumber !== 1 ? "s" : ""} on the river`, {
      fontSize: "11px", color: "#4a3820", fontFamily: "Georgia, serif", fontStyle: "italic",
    }).setOrigin(0.5, 0);
  }

  private drawFieldNotes(x: number, startY: number) {
    const notes = this.state.fieldNotes;

    this.add.text(x, startY, `Field Notes  (${notes.length})`, {
      fontSize: "11px", color: "#5a4a2a", fontFamily: "Georgia, serif", letterSpacing: 3,
    }).setOrigin(0, 0);

    if (notes.length === 0) {
      this.add.text(x, startY + 28, "None collected this run.", {
        fontSize: "12px", color: "#3a3020", fontFamily: "Georgia, serif", fontStyle: "italic",
      }).setOrigin(0, 0);
      return;
    }

    notes.slice(0, 5).forEach((note, i) => {
      const y = startY + 28 + i * 38;
      this.add.text(x, y, `✦ ${note.species}`, {
        fontSize: "11px", color: "#f5c842", fontFamily: "Georgia, serif", fontStyle: "italic",
      }).setOrigin(0, 0);
      this.add.text(x, y + 14, note.text, {
        fontSize: "10px",
        color: "#6b5a34",
        fontFamily: "Georgia, serif",
        wordWrap: { width: 310 },
      }).setOrigin(0, 0);
    });

    if (notes.length > 5) {
      this.add.text(x, startY + 28 + 5 * 38, `…and ${notes.length - 5} more`, {
        fontSize: "10px", color: "#3a3020", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0);
    }
  }

  private drawCrewSummary(cx: number, y: number) {
    if (!this.state.crew.length) return;
    this.add.text(cx, y, "CREW", {
      fontSize: "9px", color: "#4a3820", fontFamily: "Georgia, serif", letterSpacing: 4,
    }).setOrigin(0.5);

    this.state.crew.forEach((member, i) => {
      const tx = cx + (i - (this.state.crew.length - 1) / 2) * 280;
      this.add.text(tx, y + 18, member.name, {
        fontSize: "13px", color: "#c8b080", fontFamily: "Georgia, serif",
      }).setOrigin(0.5);
      this.add.text(tx, y + 34, member.role, {
        fontSize: "10px", color: "#6b5a34", fontFamily: "Georgia, serif",
      }).setOrigin(0.5);
    });
  }
}
