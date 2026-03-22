import Phaser from "phaser";
import { EncounterEngine } from "../systems/EncounterEngine";
import { GameState } from "../systems/GameState";
import type { EncounterNode } from "@igapo/shared";

interface EncounterSceneData {
  node: EncounterNode;
  state: GameState;
}

/**
 * EncounterScene — the zoom-in scene for each river node.
 * Launched on top of MapScene; returns control when the encounter resolves.
 */
export class EncounterScene extends Phaser.Scene {
  private engine!: EncounterEngine;
  private state!: GameState;

  constructor() {
    super({ key: "EncounterScene" });
  }

  init(data: EncounterSceneData) {
    this.state = data.state;
    this.engine = new EncounterEngine(this, data.node, this.state);
  }

  create() {
    this.engine.create();
  }

  update(time: number, delta: number) {
    this.engine.update(time, delta);
  }
}
