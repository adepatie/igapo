import Phaser from "phaser";
import { GameState } from "../systems/GameState";

const BAR_WIDTH = 80;
const BAR_HEIGHT = 8;
const COLORS = {
  fuel: 0xe8a020,
  food: 0x6ab04c,
  medicine: 0x4a9ade,
  equipment: 0xa084ca,
  morale: 0xe84040,
  bg: 0x1a1208,
  label: "#c8b87a",
  value: "#e8d5a3",
};

/**
 * ResourceHUD — persistent top-left resource display.
 */
export class ResourceHUD {
  private scene: Phaser.Scene;
  private state: GameState;
  private bars: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private timeText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
  }

  create() {
    const pad = 12;
    const startY = 16;
    const rowH = 22;

    // Panel bg
    this.scene.add.rectangle(90, startY + (rowH * 5) / 2 + 4, 192, rowH * 5 + 16, 0x0d0a06, 0.82)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(1, 0x3d2e0a);

    const resources: [keyof typeof COLORS, string][] = [
      ["fuel", "Fuel"],
      ["food", "Food"],
      ["medicine", "Medicine"],
      ["equipment", "Equipment"],
      ["morale", "Morale"],
    ];

    resources.forEach(([key, label], i) => {
      const y = startY + i * rowH + rowH / 2;

      // Label
      this.scene.add.text(pad, y, label, {
        fontSize: "11px",
        color: COLORS.label,
        fontFamily: "Georgia, serif",
      }).setOrigin(0, 0.5);

      // Bar bg
      this.scene.add.rectangle(pad + 72, y, BAR_WIDTH, BAR_HEIGHT, 0x2a2010, 1).setOrigin(0, 0.5);

      // Bar fill
      const fill = this.scene.add.rectangle(pad + 72, y, BAR_WIDTH, BAR_HEIGHT, COLORS[key] as number, 1).setOrigin(0, 0.5);
      this.bars.set(key, fill);
    });

    // Time / Day
    const { width } = this.scene.scale;
    this.timeText = this.scene.add.text(width - 12, 12, "", {
      fontSize: "13px",
      color: COLORS.value,
      fontFamily: "Georgia, serif",
    }).setOrigin(1, 0);

    this.dayText = this.scene.add.text(width - 12, 30, "", {
      fontSize: "11px",
      color: COLORS.label,
      fontFamily: "Georgia, serif",
    }).setOrigin(1, 0);
  }

  update() {
    const { resources } = this.state;

    for (const [key, bar] of this.bars) {
      const pct = resources[key as keyof typeof resources] / 100;
      bar.setScale(Math.max(0, pct), 1);
    }

    const tod = this.state.timeOfDay.charAt(0).toUpperCase() + this.state.timeOfDay.slice(1);
    this.timeText.setText(tod);
    this.dayText.setText(`Day ${this.state.dayNumber}`);
  }
}
