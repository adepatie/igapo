import Phaser from "phaser";
import { RiverMap } from "../systems/RiverMap";
import { GameState } from "../systems/GameState";

/**
 * MapScene — the overhead river navigation layer.
 * Renders the branching river graph, fog of war, and handles node selection.
 */
export class MapScene extends Phaser.Scene {
  private riverMap!: RiverMap;
  private state!: GameState;

  constructor() {
    super({ key: "MapScene" });
  }

  create() {
    this.state = new GameState();
    this.riverMap = new RiverMap(this, this.state);
    this.riverMap.create();

    // Launch the persistent UI overlay
    this.scene.launch("UIScene", { state: this.state });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.riverMap.handleClick(pointer);
    });
  }

  update(time: number, delta: number) {
    this.riverMap.update(time, delta);
  }
}
