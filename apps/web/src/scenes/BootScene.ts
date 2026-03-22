import Phaser from "phaser";

/**
 * BootScene — brief atmospheric preload before TitleScene.
 * Draws a rotating compass rose, fades in the title, then transitions.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Asset loading will go here when art is ready
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(cx, cy, width, height, 0x060402);

    const rose = this.add.container(cx, cy - 36);
    rose.setAlpha(0);
    this.buildCompassRose(rose);

    const title = this.add.text(cx, cy + 76, "VÁRZEA", {
      fontSize: "48px",
      color: "#f5c842",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      letterSpacing: 14,
    }).setOrigin(0.5).setAlpha(0);

    const sub = this.add.text(cx, cy + 126, "Into the Flooded Forest", {
      fontSize: "13px",
      color: "#6b5a34",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      letterSpacing: 6,
    }).setOrigin(0.5).setAlpha(0);

    // Fade in compass rose
    this.tweens.add({
      targets: rose,
      alpha: 0.6,
      duration: 900,
      ease: "Sine.easeIn",
    });

    // Slow rotation
    this.tweens.add({
      targets: rose,
      angle: 12,
      duration: 3200,
      ease: "Sine.easeInOut",
    });

    // Fade in title text after compass appears
    this.time.delayedCall(600, () => {
      this.tweens.add({
        targets: [title, sub],
        alpha: 1,
        duration: 700,
        ease: "Sine.easeIn",
      });
    });

    // Hold, then fade out and start TitleScene
    this.time.delayedCall(2400, () => {
      this.tweens.add({
        targets: [rose, title, sub],
        alpha: 0,
        duration: 500,
        ease: "Sine.easeOut",
        onComplete: () => this.scene.start("TitleScene"),
      });
    });
  }

  private buildCompassRose(container: Phaser.GameObjects.Container) {
    const g = this.add.graphics();
    const R = 38;
    const r = 12;

    const gold = 0xf5c842;
    const dark = 0x5a4a2a;
    const vdark = 0x3d2e0a;

    // Outer ring
    g.lineStyle(1, vdark, 0.5);
    g.strokeCircle(0, 0, R + 9);

    // Intercardinal points (NE, SE, SW, NW) — short, dark
    [45, 135, 225, 315].forEach(deg => {
      const a = Phaser.Math.DegToRad(deg);
      const iR = R * 0.58;
      const ir = r * 0.85;
      const aL = Phaser.Math.DegToRad(deg - 13);
      const aR = Phaser.Math.DegToRad(deg + 13);
      g.fillStyle(vdark, 1);
      g.fillTriangle(0, 0,
        ir * Math.cos(aL), ir * Math.sin(aL),
        iR * Math.cos(a),  iR * Math.sin(a));
      g.fillTriangle(0, 0,
        iR * Math.cos(a),  iR * Math.sin(a),
        ir * Math.cos(aR), ir * Math.sin(aR));
    });

    // Cardinal points — N bright gold, S/E/W muted
    [[270, gold], [90, dark], [0, dark], [180, dark]].forEach(([deg, col]) => {
      const a = Phaser.Math.DegToRad(deg as number);
      const aL = Phaser.Math.DegToRad((deg as number) - 19);
      const aR = Phaser.Math.DegToRad((deg as number) + 19);
      g.fillStyle(col as number, 1);
      g.fillTriangle(0, 0,
        r * Math.cos(aL), r * Math.sin(aL),
        R * Math.cos(a),  R * Math.sin(a));
      g.fillTriangle(0, 0,
        R * Math.cos(a),  R * Math.sin(a),
        r * Math.cos(aR), r * Math.sin(aR));
    });

    // Center
    g.fillStyle(0x1a1208, 1);
    g.fillCircle(0, 0, 5);
    g.lineStyle(1, gold, 0.7);
    g.strokeCircle(0, 0, 5);

    container.add(g);

    // North label
    const n = this.add.text(0, -R - 16, "N", {
      fontSize: "10px", color: "#f5c842", fontFamily: "Georgia, serif", fontStyle: "italic",
    }).setOrigin(0.5);
    container.add(n);
  }
}
