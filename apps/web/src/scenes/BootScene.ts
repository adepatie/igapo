import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Placeholder: load assets here as art comes in
    // this.load.image("key", "assets/...");
  }

  create() {
    this.scene.start("MapScene");
  }
}
