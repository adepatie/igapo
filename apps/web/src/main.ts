import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { ArchetypeScene } from "./scenes/ArchetypeScene";
import { MapScene } from "./scenes/MapScene";
import { EncounterScene } from "./scenes/EncounterScene";
import { UIScene } from "./scenes/UIScene";
import { RunEndScene } from "./scenes/RunEndScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: "#0d0a06",
  scene: [BootScene, TitleScene, ArchetypeScene, MapScene, EncounterScene, UIScene, RunEndScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};

new Phaser.Game(config);
