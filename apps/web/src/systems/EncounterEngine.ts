import Phaser from "phaser";
import type { EncounterNode, EncounterChoice, Resources } from "@igapo/shared";
import { GameState } from "./GameState";
import { resolveOutcome } from "../data/encounterData";

const W_FRAC = 0.68;

export class EncounterEngine {
  private scene: Phaser.Scene;
  private node: EncounterNode;
  private state: GameState;
  private container!: Phaser.GameObjects.Container;
  private choiceButtons: Phaser.GameObjects.Text[] = [];
  private phase: "arrival" | "choice" | "outcome" = "arrival";

  constructor(scene: Phaser.Scene, node: EncounterNode, state: GameState) {
    this.scene = scene;
    this.node = node;
    this.state = state;
  }

  create() {
    const { width, height } = this.scene.scale;
    const panelW = width * W_FRAC;
    const panelH = height * 0.82;
    const cx = width / 2;
    const cy = height / 2;

    this.container = this.scene.add.container(cx, cy);

    // Panel backdrop
    const bg = this.scene.add.rectangle(0, 0, panelW, panelH, 0x0a0705, 0.96)
      .setStrokeStyle(1, 0x5a3e14);
    this.container.add(bg);

    // Node type tag
    const typeColor: Record<string, string> = {
      wildlife: "#6ab04c", human: "#c8945a", navigation: "#4a9ade",
      discovery: "#f5c842", story: "#e84040",
    };
    const tag = this.scene.add.text(0, -panelH / 2 + 14, this.node.type.toUpperCase(), {
      fontSize: "9px",
      color: typeColor[this.node.type] ?? "#8a7a52",
      fontFamily: "Georgia, serif",
      letterSpacing: 4,
    }).setOrigin(0.5);
    this.container.add(tag);

    // Title
    const title = this.scene.add.text(0, -panelH / 2 + 34, this.node.title, {
      fontSize: "20px",
      color: "#f5c842",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      wordWrap: { width: panelW - 48 },
      align: "center",
    }).setOrigin(0.5, 0);
    this.container.add(title);

    // Divider
    const divY = -panelH / 2 + 68;
    const div = this.scene.add.rectangle(0, divY, panelW - 48, 1, 0x3d2e0a);
    this.container.add(div);

    // Arrival text
    const arrY = divY + 16;
    const arrText = this.scene.add.text(-panelW / 2 + 28, arrY, this.node.arrivalText, {
      fontSize: "13px",
      color: "#c8b080",
      fontFamily: "Georgia, serif",
      wordWrap: { width: panelW - 56 },
      lineSpacing: 5,
    }).setOrigin(0, 0);
    this.container.add(arrText);

    // Crew comment (if any crew trait is relevant)
    const crewComment = this.getCrewComment();
    if (crewComment) {
      const ccY = arrY + arrText.height + 12;
      const cc = this.scene.add.text(-panelW / 2 + 28, ccY, `"${crewComment.text}"  — ${crewComment.name}`, {
        fontSize: "11px",
        color: "#6b7a5a",
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        wordWrap: { width: panelW - 56 },
      }).setOrigin(0, 0);
      this.container.add(cc);
    }

    // Choice label
    const choiceLabelY = panelH / 2 - 180;
    const choiceLabel = this.scene.add.text(-panelW / 2 + 28, choiceLabelY, "What do you do?", {
      fontSize: "11px",
      color: "#5a4a2a",
      fontFamily: "Georgia, serif",
      letterSpacing: 2,
    }).setOrigin(0, 0);
    this.container.add(choiceLabel);

    this.showChoices(panelW, panelH);
  }

  update(_t: number, _d: number) {}

  private showChoices(panelW: number, panelH: number) {
    this.phase = "choice";

    const available = this.node.choices.filter(
      (c) => !c.requiresFieldNote || this.state.hasFieldNote(c.requiresFieldNote)
    );
    const locked = this.node.choices.filter(
      (c) => c.requiresFieldNote && !this.state.hasFieldNote(c.requiresFieldNote)
    );

    const startY = -panelH / 2 + panelH - 175;

    available.forEach((choice, i) => {
      const y = startY + i * 40;
      const btn = this.scene.add.text(-panelW / 2 + 28, y, `› ${choice.label}`, {
        fontSize: "13px",
        color: "#a8c89a",
        fontFamily: "Georgia, serif",
        wordWrap: { width: panelW - 56 },
      }).setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => btn.setColor("#f5c842"))
        .on("pointerout", () => btn.setColor("#a8c89a"))
        .on("pointerdown", () => this.resolveChoice(choice, panelW, panelH));
      this.container.add(btn);
      this.choiceButtons.push(btn);
    });

    // Show locked options as greyed hints
    locked.slice(0, 1).forEach((choice, i) => {
      const y = startY + (available.length + i) * 40;
      const hint = this.scene.add.text(-panelW / 2 + 28, y,
        `○ ${choice.label}  [requires field note]`, {
        fontSize: "11px",
        color: "#3a3020",
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        wordWrap: { width: panelW - 56 },
      }).setOrigin(0, 0);
      this.container.add(hint);
      this.choiceButtons.push(hint);
    });
  }

  private resolveChoice(choice: EncounterChoice, panelW: number, panelH: number) {
    if (this.phase !== "choice") return;
    this.phase = "outcome";
    this.choiceButtons.forEach((b) => b.destroy());
    this.choiceButtons = [];

    const outcome = resolveOutcome(choice, this.state);

    // Apply resource deltas — positive=gain, negative=loss
    const deltas: Partial<Resources> = {};
    if (outcome.resourceDelta) {
      for (const [k, v] of Object.entries(outcome.resourceDelta) as [keyof Resources, number][]) {
        if (!v) continue;
        deltas[k] = v;
        if (v > 0) {
          this.state.resources[k] = Math.min(100, this.state.resources[k] + v);
        } else {
          this.state.drainResources({ [k]: -v });
        }
      }
    }

    if (outcome.fieldNote) this.state.addFieldNote(outcome.fieldNote);

    const divY = -panelH / 2 + 68;
    const startY = divY + 16;

    // Outcome divider
    const odiv = this.scene.add.rectangle(0, startY + 110, panelW - 48, 1, 0x2a1e08);
    this.container.add(odiv);

    // Field note flash
    if (outcome.fieldNote) {
      const flash = this.scene.add.text(0, startY + 122, "✦ Field Note Gained", {
        fontSize: "11px", color: "#f5c842", fontFamily: "Georgia, serif", letterSpacing: 2,
      }).setOrigin(0.5, 0);
      this.container.add(flash);
      this.scene.tweens.add({ targets: flash, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });
    }

    // Outcome text
    const outcomeStart = startY + (outcome.fieldNote ? 142 : 126);
    const outcomeText = this.scene.add.text(-panelW / 2 + 28, outcomeStart, outcome.text, {
      fontSize: "13px",
      color: "#d4c49a",
      fontFamily: "Georgia, serif",
      wordWrap: { width: panelW - 56 },
      lineSpacing: 5,
    }).setOrigin(0, 0);
    this.container.add(outcomeText);

    // Resource delta display
    const deltaEntries = Object.entries(deltas).filter(([, v]) => v !== 0);
    if (deltaEntries.length > 0) {
      const deltaY = panelH / 2 - 68;
      deltaEntries.forEach(([k, v], i) => {
        const sign = (v as number) > 0 ? "+" : "";
        const color = (v as number) > 0 ? "#6ab04c" : "#c84040";
        const label = k.charAt(0).toUpperCase() + k.slice(1);
        const d = this.scene.add.text(
          -panelW / 2 + 28 + i * 110, deltaY,
          `${sign}${v} ${label}`, {
          fontSize: "11px", color, fontFamily: "Georgia, serif",
        }).setOrigin(0, 0.5);
        this.container.add(d);
      });
    }

    // Continue button
    const continueBtn = this.scene.add.text(panelW / 2 - 24, panelH / 2 - 24, "Continue →", {
      fontSize: "14px", color: "#a8c89a", fontFamily: "Georgia, serif",
    }).setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => continueBtn.setColor("#f5c842"))
      .on("pointerout", () => continueBtn.setColor("#a8c89a"))
      .on("pointerdown", () => this.close());
    this.container.add(continueBtn);
  }

  private getCrewComment(): { name: string; text: string } | null {
    if (!this.state.crew.length) return null;
    const comments: Record<string, Record<string, string>> = {
      wildlife: {
        dr_melo: "Approach slowly. Let the animal decide.",
        solange: "I've seen people get bit doing exactly this.",
      },
      human: {
        catarina: "Let me speak first. I know these communities.",
        raimundo: "Just be straight with them. People respect that.",
      },
      navigation: {
        solange: "I know this stretch. Mind the current on the left bank.",
        raimundo: "Engine sounds fine but that water color worries me.",
      },
      discovery: {
        dr_melo: "This is exactly what we came for. Document everything.",
      },
      story: {
        catarina: "Something's not right here. I can feel it.",
      },
    };
    for (const member of this.state.crew) {
      const comment = comments[this.node.type]?.[member.id];
      if (comment) return { name: member.name, text: comment };
    }
    return null;
  }

  private close() {
    this.container.destroy();
    this.scene.scene.stop("EncounterScene");
    this.scene.scene.resume("MapScene");
  }
}
