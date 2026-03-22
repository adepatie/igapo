import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { ResourceHUD } from "../ui/ResourceHUD";

/**
 * UIScene — persistent overlay running parallel to MapScene and EncounterScene.
 * Renders resources, time of day, and any global UI elements.
 */
export class UIScene extends Phaser.Scene {
  private hud!: ResourceHUD;
  private state!: GameState;

  constructor() {
    super({ key: "UIScene" });
  }

  init(data: { state: GameState }) {
    this.state = data.state;
  }

  create() {
    this.hud = new ResourceHUD(this, this.state);
    this.hud.create();
  }

  update(_time: number, delta: number) {
    this.hud.update(delta);
  }
}
