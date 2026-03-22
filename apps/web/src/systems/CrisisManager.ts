import Phaser from "phaser";
import { GameState } from "./GameState";

type CrisisType = "fuel" | "food" | "morale" | "equipment" | "equipment_total";

interface CrisisEvent {
  type: CrisisType;
  title: string;
  text: string;
  effect: (state: GameState) => void;
}

const CRISES: Record<CrisisType, CrisisEvent> = {
  equipment_total: {
    type: "equipment_total",
    title: "The Boat is Dead",
    text: "The hull is taking water. The engine won't start. The radio is gone. You are in the middle of the várzea with a boat that is no longer a boat. The expedition ends here — you are lucky it ends only here.",
    effect: () => {},
  },
  fuel: {
    type: "fuel",
    title: "Engine Stalled",
    text: "The fuel tank is empty. The engine sputters, coughs, and dies. You drift to the nearest bank. Without fuel, you cannot continue — the expedition ends here.",
    effect: () => {},
  },
  food: {
    type: "food",
    title: "Supplies Exhausted",
    text: "The last of the food ran out this morning. The crew is quiet. Morale is collapsing. You may be able to forage — but not fast enough to outrun what comes next.",
    effect: (state) => {
      state.drainResources({ morale: 25 });
    },
  },
  morale: {
    type: "morale",
    title: "Crew Mutiny",
    text: "At the last stop, two crew members took their gear off the boat without a word. The ones who remain are silent. The expedition cannot continue in this state.",
    effect: () => {},
  },
  equipment: {
    type: "equipment",
    title: "Critical Equipment Failure",
    text: "The navigation system, the radio, and the outboard motor are all compromised. You have no GPS, no communication, and limited propulsion. Continuing is reckless.",
    effect: (state) => {
      state.drainResources({ morale: 15, fuel: 10 });
    },
  },
};

/**
 * CrisisManager — checks resource thresholds after each move.
 * Critical (fuel=0, morale=0) end the run. Others impose penalties and warnings.
 */
export class CrisisManager {
  private scene: Phaser.Scene;
  private state: GameState;
  private triggeredCrises: Set<CrisisType> = new Set();
  private warningShown: Set<CrisisType> = new Set();

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
  }

  check(onRunEnd: (reason: CrisisType) => void): boolean {
    const { fuel, food, morale, equipment } = this.state.resources;

    // Run-ending crises
    if (fuel <= 0 && !this.triggeredCrises.has("fuel")) {
      this.triggeredCrises.add("fuel");
      this.showCrisis("fuel", () => onRunEnd("fuel"));
      return true;
    }
    if (morale <= 0 && !this.triggeredCrises.has("morale")) {
      this.triggeredCrises.add("morale");
      this.showCrisis("morale", () => onRunEnd("morale"));
      return true;
    }
    if (equipment <= 0 && !this.triggeredCrises.has("equipment_total")) {
      this.triggeredCrises.add("equipment_total");
      this.showCrisis("equipment_total", () => onRunEnd("equipment"));
      return true;
    }

    // Penalty crises (fire once, add penalties)
    if (food <= 0 && !this.triggeredCrises.has("food")) {
      this.triggeredCrises.add("food");
      CRISES.food.effect(this.state);
      this.showWarning("Your food supplies are gone. Morale is suffering.");
    }
    if (equipment <= 10 && !this.triggeredCrises.has("equipment")) {
      this.triggeredCrises.add("equipment");
      CRISES.equipment.effect(this.state);
      this.showWarning("Equipment is critically degraded. Navigation and communication are compromised.");
    }

    // Low-resource warnings (shown once per threshold)
    if (fuel <= 20 && !this.warningShown.has("fuel")) {
      this.warningShown.add("fuel");
      this.showWarning("Fuel is running low. Find a resupply before venturing deeper.");
    }
    if (morale <= 25 && !this.warningShown.has("morale")) {
      this.warningShown.add("morale");
      this.showWarning("Crew morale is dangerously low. A rest or successful encounter is needed.");
    }

    return false;
  }

  private showCrisis(type: CrisisType, onContinue: () => void) {
    const crisis = CRISES[type];
    const { width, height } = this.scene.scale;
    const cx = width / 2;
    const panelW = 560;
    const panelH = 220;

    const container = this.scene.add.container(cx, height / 2);
    container.setDepth(100);

    const bg = this.scene.add.rectangle(0, 0, panelW, panelH, 0x0a0402, 0.97)
      .setStrokeStyle(2, 0x7a1a1a);
    container.add(bg);

    container.add(this.scene.add.text(0, -panelH / 2 + 24, crisis.title, {
      fontSize: "18px", color: "#c84040", fontFamily: "Georgia, serif", fontStyle: "italic",
    }).setOrigin(0.5));

    container.add(this.scene.add.rectangle(0, -panelH / 2 + 46, panelW - 40, 1, 0x3a1a1a));

    container.add(this.scene.add.text(0, -panelH / 2 + 64, crisis.text, {
      fontSize: "12px", color: "#9a8060", fontFamily: "Georgia, serif",
      wordWrap: { width: panelW - 48 }, lineSpacing: 5, align: "center",
    }).setOrigin(0.5, 0));

    const btn = this.scene.add.text(0, panelH / 2 - 22, "End Expedition", {
      fontSize: "14px", color: "#c84040", fontFamily: "Georgia, serif",
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => btn.setColor("#f5c842"))
      .on("pointerout", () => btn.setColor("#c84040"))
      .on("pointerdown", () => {
        container.destroy();
        onContinue();
      });
    container.add(btn);
  }

  private showWarning(text: string) {
    const { width, height } = this.scene.scale;
    const banner = this.scene.add.text(width / 2, height - 110, `⚠  ${text}`, {
      fontSize: "12px", color: "#e8a020", fontFamily: "Georgia, serif",
      fontStyle: "italic", backgroundColor: "#0a0702", padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(50).setAlpha(0);

    this.scene.tweens.add({
      targets: banner,
      alpha: 1, duration: 300, yoyo: false,
      onComplete: () => {
        this.scene.time.delayedCall(3200, () => {
          this.scene.tweens.add({ targets: banner, alpha: 0, duration: 500,
            onComplete: () => banner.destroy() });
        });
      },
    });
  }
}
