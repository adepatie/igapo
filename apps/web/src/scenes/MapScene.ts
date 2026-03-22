import Phaser from "phaser";
import { ARCHETYPES, assignCrew } from "@igapo/shared";
import type { ArchetypeId } from "@igapo/shared";
import { RiverMap } from "../systems/RiverMap";
import { GameState } from "../systems/GameState";

interface MapSceneData {
  archetypeId: ArchetypeId;
}

export class MapScene extends Phaser.Scene {
  private riverMap!: RiverMap;
  private state!: GameState;

  constructor() {
    super({ key: "MapScene" });
  }

  init(data: MapSceneData) {
    const archetype = ARCHETYPES.find((a) => a.id === data.archetypeId) ?? ARCHETYPES[0];
    this.state = new GameState(archetype);
    this.state.crew = assignCrew(2);
  }

  create() {
    this.riverMap = new RiverMap(this, this.state);
    this.riverMap.create();

    this.scene.launch("UIScene", { state: this.state });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.riverMap.handleClick(pointer);
    });
  }

  update(time: number, delta: number) {
    this.riverMap.update(time, delta);
  }
}
