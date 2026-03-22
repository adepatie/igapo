import Phaser from "phaser";
import { ARCHETYPES, assignCrew } from "@igapo/shared";
import type { ArchetypeId } from "@igapo/shared";
import { RiverMap } from "../systems/RiverMap";
import { GameState } from "../systems/GameState";
import { CrisisManager } from "../systems/CrisisManager";
import { selectEncounter } from "../data/encounterSelector";
import { generateRun } from "../data/mapGenerator";
import { ambientSound } from "../systems/AmbientSound";

interface MapSceneData {
  archetypeId: ArchetypeId;
}

export class MapScene extends Phaser.Scene {
  private riverMap!: RiverMap;
  private state!: GameState;
  private crisis!: CrisisManager;

  constructor() {
    super({ key: "MapScene" });
  }

  init(data: MapSceneData) {
    const archetype = ARCHETYPES.find((a) => a.id === data.archetypeId) ?? ARCHETYPES[0];
    this.state = new GameState(archetype);
    this.state.crew = assignCrew(2);
  }

  create() {
    // Start ambient sound on first user interaction
    this.input.once("pointerdown", () => ambientSound.start());

    this.riverMap = new RiverMap(this, this.state);
    this.riverMap.create();
    this.crisis = new CrisisManager(this, this.state);

    this.scene.launch("UIScene", { state: this.state });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.riverMap.handleClick(pointer, (nodeId) => {
        // Check for crises after each move
        const runEnded = this.crisis.check((reason) => {
          this.scene.stop("UIScene");
          this.scene.start("RunEndScene", { state: this.state, reason });
        });
        if (!runEnded && nodeId === "destination") {
          this.scene.stop("UIScene");
          this.scene.start("RunEndScene", { state: this.state, reason: "destination" });
        }
      });
    });

    // Trigger the opening encounter at the starting town
    this.time.delayedCall(400, () => {
      const run = generateRun();
      const startNode = run.nodes.find(n => n.id === "start");
      if (startNode) {
        const enc = selectEncounter(startNode, this.state);
        if (enc) {
          this.scene.launch("EncounterScene", { node: enc, state: this.state });
          this.scene.pause("MapScene");
        }
      }
    });
  }

  update(time: number, delta: number) {
    this.riverMap.update(time, delta);
    ambientSound.sync(this.state);
  }
}
