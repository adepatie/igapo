import Phaser from "phaser";
import { Codex } from "../systems/Codex";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Background
    this.add.rectangle(cx, height / 2, width, height, 0x0d0a06);

    // Decorative river line — drawn as segmented lineTo approximations
    const g = this.add.graphics();
    g.lineStyle(1, 0x3d5a40, 0.4);
    g.beginPath();
    // Waypoints for a gentle river curve across the lower third
    const pts1 = [
      [0, height * 0.55], [width * 0.15, height * 0.52], [width * 0.3, height * 0.57],
      [width * 0.5, height * 0.53], [width * 0.65, height * 0.50], [width * 0.8, height * 0.54], [width, height * 0.50],
    ];
    pts1.forEach(([x, y], i) => i === 0 ? g.moveTo(x, y) : g.lineTo(x, y));
    g.strokePath();
    g.lineStyle(1, 0x3d5a40, 0.2);
    g.beginPath();
    const pts2 = [
      [0, height * 0.58], [width * 0.2, height * 0.56], [width * 0.4, height * 0.61],
      [width * 0.6, height * 0.57], [width * 0.75, height * 0.52], [width * 0.9, height * 0.56], [width, height * 0.53],
    ];
    pts2.forEach(([x, y], i) => i === 0 ? g.moveTo(x, y) : g.lineTo(x, y));
    g.strokePath();

    // Subtitle
    this.add.text(cx, height * 0.22, "INTO THE", {
      fontSize: "16px",
      color: "#8a7a52",
      fontFamily: "Georgia, serif",
      letterSpacing: 10,
    }).setOrigin(0.5);

    // Title
    this.add.text(cx, height * 0.32, "Várzea", {
      fontSize: "72px",
      color: "#f5c842",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
    }).setOrigin(0.5);

    // Tagline
    this.add.text(cx, height * 0.47, "A river expedition of ecology, survival, and quiet discovery.", {
      fontSize: "14px",
      color: "#7a8c6a",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
    }).setOrigin(0.5);

    // Begin button
    const beginBtn = this.add.text(cx, height * 0.72, "Begin Expedition →", {
      fontSize: "18px",
      color: "#a8c89a",
      fontFamily: "Georgia, serif",
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    beginBtn.on("pointerover", () => beginBtn.setColor("#f5c842"));
    beginBtn.on("pointerout", () => beginBtn.setColor("#a8c89a"));
    beginBtn.on("pointerdown", () => this.scene.start("ArchetypeScene"));

    // Version
    this.add.text(width - 12, height - 12, "v0.1 — Prototype", {
      fontSize: "10px",
      color: "#3a3020",
      fontFamily: "Georgia, serif",
    }).setOrigin(1, 1);

    // Returning player: codex status
    const codex = Codex.load();
    if (codex.totalRuns > 0) {
      this.add.text(cx, height * 0.84, `${codex.totalRuns} expedition${codex.totalRuns !== 1 ? "s" : ""} made  ·  ${codex.totalNotes} field note${codex.totalNotes !== 1 ? "s" : ""} documented`, {
        fontSize: "11px",
        color: "#4a3820",
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
      }).setOrigin(0.5);
      if (codex.metaFragments.length > 0) {
        this.add.text(cx, height * 0.88, `Zona Silenciosa: ${codex.metaFragments.length} / 8 fragments`, {
          fontSize: "10px",
          color: codex.metaFragments.length >= 5 ? "#c84040" : "#3a2a1a",
          fontFamily: "Georgia, serif",
          letterSpacing: 2,
        }).setOrigin(0.5);
      }
    }

    // Pulse the begin text
    this.tweens.add({
      targets: beginBtn,
      alpha: 0.6,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
