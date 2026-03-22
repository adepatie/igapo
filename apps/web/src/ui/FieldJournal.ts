import Phaser from "phaser";
import { GameState } from "../systems/GameState";

/**
 * FieldJournal — a toggleable slide-in panel showing collected Field Notes.
 * Press [J] or click the journal button in the HUD to open/close.
 */
export class FieldJournal {
  private scene: Phaser.Scene;
  private state: GameState;

  private panel!: Phaser.GameObjects.Container;
  private isOpen = false;

  private readonly PANEL_W = 380;
  private readonly PANEL_H = 560;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
  }

  create() {
    const { width, height } = this.scene.scale;
    const px = width - this.PANEL_W / 2 - 16;
    const py = height / 2;

    this.panel = this.scene.add.container(px + this.PANEL_W + 20, py);
    this.panel.setAlpha(0);

    this.buildPanel();

    // Keyboard shortcut
    this.scene.input.keyboard?.addKey("J").on("down", () => this.toggle());
  }

  toggle() {
    this.isOpen = !this.isOpen;
    const { width } = this.scene.scale;
    const targetX = this.isOpen
      ? width - this.PANEL_W / 2 - 16
      : width + this.PANEL_W;

    this.scene.tweens.add({
      targets: this.panel,
      x: targetX,
      alpha: this.isOpen ? 1 : 0,
      duration: 280,
      ease: "Cubic.easeOut",
    });
  }

  private buildPanel() {
    // Background
    const bg = this.scene.add.rectangle(0, 0, this.PANEL_W, this.PANEL_H, 0x0d0a06, 0.97)
      .setStrokeStyle(1, 0x6b4f1a);
    this.panel.add(bg);

    // Header
    const header = this.scene.add.text(0, -this.PANEL_H / 2 + 22, "Field Journal", {
      fontSize: "18px",
      color: "#f5c842",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
    }).setOrigin(0.5, 0.5);
    this.panel.add(header);

    const divider = this.scene.add.rectangle(0, -this.PANEL_H / 2 + 42, this.PANEL_W - 32, 1, 0x3d2e0a);
    this.panel.add(divider);

    const hint = this.scene.add.text(this.PANEL_W / 2 - 12, -this.PANEL_H / 2 + 10, "[J]", {
      fontSize: "10px", color: "#4a3820", fontFamily: "Georgia, serif",
    }).setOrigin(1, 0.5);
    this.panel.add(hint);

    this.refreshNotes();
  }

  refreshNotes() {
    // Remove all children except the first 4 (bg, header, divider, hint)
    while (this.panel.length > 4) {
      this.panel.getAt(4)?.destroy();
      this.panel.removeAt(4);
    }

    const notes = this.state.fieldNotes;
    const startY = -this.PANEL_H / 2 + 60;
    const noteH = 88;

    if (notes.length === 0) {
      const empty = this.scene.add.text(0, startY + 40, "No field notes yet.\nObserve carefully.", {
        fontSize: "13px",
        color: "#4a3820",
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        align: "center",
        lineSpacing: 6,
      }).setOrigin(0.5, 0);
      this.panel.add(empty);
      return;
    }

    const countLabel = this.scene.add.text(-this.PANEL_W / 2 + 16, startY, `${notes.length} note${notes.length !== 1 ? "s" : ""} collected`, {
      fontSize: "10px", color: "#6b5a34", fontFamily: "Georgia, serif",
    }).setOrigin(0, 0);
    this.panel.add(countLabel);

    notes.forEach((note, i) => {
      const y = startY + 20 + i * noteH;
      if (y + noteH > this.PANEL_H / 2 - 20) return; // overflow guard

      // Note card bg
      const card = this.scene.add.rectangle(0, y + noteH / 2 - 4, this.PANEL_W - 28, noteH - 6, 0x13100a)
        .setStrokeStyle(1, 0x2a2010).setOrigin(0.5, 0);
      this.panel.add(card);

      // Species name
      const species = this.scene.add.text(-this.PANEL_W / 2 + 24, y + 8, `✦ ${note.species}`, {
        fontSize: "11px",
        color: "#f5c842",
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
      }).setOrigin(0, 0);
      this.panel.add(species);

      // Note text
      const body = this.scene.add.text(-this.PANEL_W / 2 + 24, y + 26, note.text, {
        fontSize: "11px",
        color: "#a09070",
        fontFamily: "Georgia, serif",
        wordWrap: { width: this.PANEL_W - 52 },
        lineSpacing: 3,
      }).setOrigin(0, 0);
      this.panel.add(body);
    });
  }
}
