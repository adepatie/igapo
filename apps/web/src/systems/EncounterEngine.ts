import Phaser from "phaser";
import type { EncounterNode, EncounterChoice } from "@igapo/shared";
import { GameState } from "./GameState";
import { resolveOutcome } from "../data/encounterData";

/**
 * EncounterEngine — drives the zoom-in encounter loop.
 * Three beats: Arrival → Choice → Outcome → (return to map)
 */
export class EncounterEngine {
  private scene: Phaser.Scene;
  private node: EncounterNode;
  private state: GameState;

  private overlay!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.Text[] = [];
  private outcomeText!: Phaser.GameObjects.Text;
  private continueBtn!: Phaser.GameObjects.Text;

  private phase: "arrival" | "choice" | "outcome" = "arrival";

  constructor(scene: Phaser.Scene, node: EncounterNode, state: GameState) {
    this.scene = scene;
    this.node = node;
    this.state = state;
  }

  create() {
    const { width, height } = this.scene.scale;

    // Semi-transparent backdrop
    this.overlay = this.scene.add.rectangle(
      width / 2, height / 2, width * 0.72, height * 0.8,
      0x0d0a06, 0.93
    ).setStrokeStyle(1, 0x6b4f1a);

    // Title
    this.titleText = this.scene.add.text(width / 2, height * 0.14, this.node.title, {
      fontSize: "22px",
      color: "#f5c842",
      fontFamily: "Georgia, serif",
      wordWrap: { width: width * 0.62 },
      align: "center",
    }).setOrigin(0.5);

    // Arrival description
    this.descText = this.scene.add.text(width / 2, height * 0.28, this.node.arrivalText, {
      fontSize: "14px",
      color: "#d4c49a",
      fontFamily: "Georgia, serif",
      wordWrap: { width: width * 0.60 },
      align: "left",
      lineSpacing: 6,
    }).setOrigin(0.5, 0);

    this.showChoices();
  }

  update(_time: number, _delta: number) {}

  private showChoices() {
    this.phase = "choice";
    const { width, height } = this.scene.scale;

    const availableChoices = this.node.choices.filter(
      (c) => !c.requiresFieldNote || this.state.hasFieldNote(c.requiresFieldNote)
    );

    availableChoices.forEach((choice, i) => {
      const y = height * 0.58 + i * 44;
      const btn = this.scene.add.text(width / 2, y, `› ${choice.label}`, {
        fontSize: "14px",
        color: "#a8c89a",
        fontFamily: "Georgia, serif",
        wordWrap: { width: width * 0.58 },
        align: "left",
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => btn.setColor("#f5c842"))
        .on("pointerout", () => btn.setColor("#a8c89a"))
        .on("pointerdown", () => this.resolveChoice(choice));

      this.choiceButtons.push(btn);
    });
  }

  private resolveChoice(choice: EncounterChoice) {
    this.phase = "outcome";
    this.choiceButtons.forEach((b) => b.destroy());
    this.choiceButtons = [];

    const outcome = resolveOutcome(choice, this.state);

    // Apply resource effects
    if (outcome.resourceDelta) {
      this.state.drainResources(
        Object.fromEntries(
          Object.entries(outcome.resourceDelta).map(([k, v]) => [k, -(v ?? 0)])
        )
      );
    }

    // Grant field note if earned
    if (outcome.fieldNote) {
      this.state.addFieldNote(outcome.fieldNote);
    }

    const { width, height } = this.scene.scale;

    this.outcomeText = this.scene.add.text(width / 2, height * 0.58, outcome.text, {
      fontSize: "14px",
      color: outcome.fieldNote ? "#f5c842" : "#d4c49a",
      fontFamily: "Georgia, serif",
      wordWrap: { width: width * 0.60 },
      align: "left",
      lineSpacing: 6,
    }).setOrigin(0.5, 0);

    if (outcome.fieldNote) {
      this.scene.add.text(width / 2, height * 0.58 - 20, "✦ Field Note Gained", {
        fontSize: "12px",
        color: "#f5c842",
        fontFamily: "Georgia, serif",
      }).setOrigin(0.5);
    }

    this.continueBtn = this.scene.add.text(width / 2, height * 0.86, "Continue →", {
      fontSize: "15px",
      color: "#a8c89a",
      fontFamily: "Georgia, serif",
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.continueBtn.setColor("#f5c842"))
      .on("pointerout", () => this.continueBtn.setColor("#a8c89a"))
      .on("pointerdown", () => this.close());
  }

  private close() {
    this.scene.scene.stop("EncounterScene");
    this.scene.scene.resume("MapScene");
  }
}
