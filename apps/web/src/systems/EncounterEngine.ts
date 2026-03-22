import Phaser from "phaser";
import type { EncounterNode, EncounterChoice, Resources } from "@igapo/shared";
import { GameState } from "./GameState";
import { resolveOutcome } from "../data/encounterData";
import { computeBonuses, applySuccessBonus, type ActiveBonuses } from "./BonusSystem";

const W_FRAC = 0.68;

// Injected choices from archetype/crew bonuses
const BONUS_CHOICES: Record<string, EncounterChoice[]> = {
  wildlife: [
    {
      id: "_bonus_careful_observe",
      label: "Observe with methodical patience — document every behavior you can.",
      successChance: 0.95,
    },
  ],
  human: [
    {
      id: "_bonus_press_further",
      label: "Press further. There's more to this than they're saying.",
      successChance: 0.65,
    },
    {
      id: "_bonus_trust_intro",
      label: "Introduce yourself by your work. Communities know your kind of work.",
      successChance: 0.9,
    },
  ],
};

export class EncounterEngine {
  private scene: Phaser.Scene;
  private node: EncounterNode;
  private state: GameState;
  private bonuses: ActiveBonuses;
  private container!: Phaser.GameObjects.Container;
  private choiceButtons: Phaser.GameObjects.Text[] = [];
  private phase: "arrival" | "choice" | "outcome" = "arrival";

  constructor(scene: Phaser.Scene, node: EncounterNode, state: GameState) {
    this.scene = scene;
    this.node = node;
    this.state = state;
    this.bonuses = computeBonuses(state);
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
    this.container.add(this.scene.add.rectangle(0, divY, panelW - 48, 1, 0x3d2e0a));

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

    // Crew comment
    const crewComment = this.getCrewComment();
    if (crewComment) {
      const ccY = arrY + arrText.height + 10;
      this.container.add(
        this.scene.add.text(-panelW / 2 + 28, ccY,
          `"${crewComment.text}"  — ${crewComment.name}`, {
          fontSize: "11px", color: "#6b7a5a", fontFamily: "Georgia, serif",
          fontStyle: "italic", wordWrap: { width: panelW - 56 },
        }).setOrigin(0, 0)
      );
    }

    // Time/weather context tag
    const contextTag = this.buildContextTag();
    if (contextTag) {
      this.container.add(
        this.scene.add.text(panelW / 2 - 28, -panelH / 2 + 14, contextTag, {
          fontSize: "9px", color: "#5a6a4a", fontFamily: "Georgia, serif", fontStyle: "italic",
        }).setOrigin(1, 0)
      );
    }

    // Choice label
    this.container.add(
      this.scene.add.text(-panelW / 2 + 28, panelH / 2 - 180, "What do you do?", {
        fontSize: "11px", color: "#5a4a2a", fontFamily: "Georgia, serif", letterSpacing: 2,
      }).setOrigin(0, 0)
    );

    this.showChoices(panelW, panelH);
  }

  update(_t: number, _d: number) {}

  private showChoices(panelW: number, panelH: number) {
    this.phase = "choice";

    // Base choices
    const available = this.node.choices.filter(
      (c) => !c.requiresFieldNote || this.state.hasFieldNote(c.requiresFieldNote)
    );
    const locked = this.node.choices.filter(
      (c) => c.requiresFieldNote && !this.state.hasFieldNote(c.requiresFieldNote)
    );

    // Inject bonus choices from archetype/crew
    const injected: EncounterChoice[] = [];
    if (this.node.type === "wildlife" && this.bonuses.extraWildlifeObserve) {
      // Only inject if there isn't already a careful-observe style option
      const hasObserve = available.some(c => c.id.includes("observe") || c.id.includes("wait"));
      if (!hasObserve) injected.push(...BONUS_CHOICES.wildlife);
    }
    if (this.node.type === "human") {
      if (this.bonuses.extraHumanPress) injected.push(BONUS_CHOICES.human[0]);
      if (this.bonuses.extraHumanTrust && !available.some(c => c.id.includes("trust"))) {
        injected.push(BONUS_CHOICES.human[1]);
      }
    }

    // Filter injected: don't duplicate ids
    const existingIds = new Set(available.map(c => c.id));
    const filteredInjected = injected.filter(c => !existingIds.has(c.id));

    const allChoices = [...available, ...filteredInjected];
    const startY = panelH / 2 - 175;

    allChoices.forEach((choice, i) => {
      const isBonus = filteredInjected.includes(choice);
      const y = startY + i * 40;
      const label = `${isBonus ? "◆" : "›"} ${choice.label}`;
      const btn = this.scene.add.text(-panelW / 2 + 28, y, label, {
        fontSize: "13px",
        color: isBonus ? "#c8a84a" : "#a8c89a",
        fontFamily: "Georgia, serif",
        wordWrap: { width: panelW - 56 },
      }).setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => btn.setColor("#f5c842"))
        .on("pointerout", () => btn.setColor(isBonus ? "#c8a84a" : "#a8c89a"))
        .on("pointerdown", () => this.resolveChoice(choice, panelW, panelH));
      this.container.add(btn);
      this.choiceButtons.push(btn);
    });

    // Locked hints (up to 1)
    locked.slice(0, 1).forEach((choice, i) => {
      const y = startY + (allChoices.length + i) * 40;
      const hint = this.scene.add.text(-panelW / 2 + 28, y,
        `○ ${choice.label}  [requires field note]`, {
        fontSize: "11px", color: "#3a3020", fontFamily: "Georgia, serif",
        fontStyle: "italic", wordWrap: { width: panelW - 56 },
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

    // Apply archetype/crew success bonus
    const adjustedChance = applySuccessBonus(
      choice.successChance ?? 1.0,
      this.node.type,
      this.bonuses
    );
    const adjustedChoice = { ...choice, successChance: adjustedChance };

    // Bonus choice outcomes
    if (choice.id === "_bonus_careful_observe") {
      this.showOutcomeText(panelW, panelH, {
        text: "You settle into methodical observation. The animal — whatever its initial wariness — adjusts to your presence. You document behavior that a faster approach would have disrupted.",
        resourceDelta: { morale: 8 },
      }, {});
      return;
    }
    if (choice.id === "_bonus_press_further") {
      const success = Math.random() < adjustedChance;
      this.showOutcomeText(panelW, panelH, {
        text: success
          ? "You read the hesitation correctly. There is more — and they tell you, carefully, in the way people tell things to someone they've decided they can probably trust."
          : "You pushed too soon. The conversation closes. You leave with the feeling that you had it, briefly, and lost it.",
        resourceDelta: success ? {} : { morale: -8 },
      }, {});
      return;
    }
    if (choice.id === "_bonus_trust_intro") {
      this.showOutcomeText(panelW, panelH, {
        text: "The introduction lands. Your work is known here — or at least, the kind of work it is. The conversation that follows is longer and more honest than you expected.",
        resourceDelta: { morale: 10 },
      }, {});
      return;
    }

    const outcome = resolveOutcome(adjustedChoice, this.state);

    // Storm morale penalty
    if (this.node.type === "navigation" && this.state.weather === "storm") {
      outcome.resourceDelta = {
        ...outcome.resourceDelta,
        morale: (outcome.resourceDelta?.morale ?? 0) - this.bonuses.stormMoralePenalty,
      };
    }

    // Night igapó penalty (crew superstition)
    if (this.state.timeOfDay === "night" && this.bonuses.nightIgapoPenalty > 0) {
      outcome.resourceDelta = {
        ...outcome.resourceDelta,
        morale: (outcome.resourceDelta?.morale ?? 0) - this.bonuses.nightIgapoPenalty,
      };
    }

    // Equipment decay modifier (engine_sense crew trait)
    if (outcome.resourceDelta?.equipment && outcome.resourceDelta.equipment < 0) {
      outcome.resourceDelta.equipment = Math.round(
        outcome.resourceDelta.equipment * this.bonuses.equipmentDecayRate
      );
    }

    this.showOutcomeText(panelW, panelH, outcome, {});
  }

  private showOutcomeText(
    panelW: number,
    panelH: number,
    outcome: { text: string; resourceDelta?: Partial<Resources>; fieldNote?: import("@igapo/shared").FieldNote },
    _extra: object
  ) {
    const deltas: Partial<Resources> = {};
    if (outcome.resourceDelta) {
      for (const [k, v] of Object.entries(outcome.resourceDelta) as [keyof Resources, number][]) {
        if (!v) continue;
        deltas[k] = v;
        if (v > 0) this.state.resources[k] = Math.min(100, this.state.resources[k] + v);
        else this.state.drainResources({ [k]: -v });
      }
    }
    if (outcome.fieldNote) this.state.addFieldNote(outcome.fieldNote);

    const divY = -panelH / 2 + 68;

    this.container.add(this.scene.add.rectangle(0, divY + 110, panelW - 48, 1, 0x2a1e08));

    if (outcome.fieldNote) {
      const flash = this.scene.add.text(0, divY + 122, "✦ Field Note Gained", {
        fontSize: "11px", color: "#f5c842", fontFamily: "Georgia, serif", letterSpacing: 2,
      }).setOrigin(0.5, 0);
      this.container.add(flash);
      this.scene.tweens.add({ targets: flash, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });
    }

    const outcomeStart = divY + (outcome.fieldNote ? 142 : 126);
    this.container.add(
      this.scene.add.text(-panelW / 2 + 28, outcomeStart, outcome.text, {
        fontSize: "13px", color: "#d4c49a", fontFamily: "Georgia, serif",
        wordWrap: { width: panelW - 56 }, lineSpacing: 5,
      }).setOrigin(0, 0)
    );

    // Resource delta display
    const deltaEntries = Object.entries(deltas).filter(([, v]) => v !== 0);
    if (deltaEntries.length > 0) {
      const deltaY = panelH / 2 - 60;
      deltaEntries.forEach(([k, v], i) => {
        const sign = (v as number) > 0 ? "+" : "";
        const color = (v as number) > 0 ? "#6ab04c" : "#c84040";
        const label = k.charAt(0).toUpperCase() + k.slice(1);
        this.container.add(
          this.scene.add.text(-panelW / 2 + 28 + i * 110, deltaY, `${sign}${v} ${label}`, {
            fontSize: "11px", color, fontFamily: "Georgia, serif",
          }).setOrigin(0, 0.5)
        );
      });
    }

    const continueBtn = this.scene.add.text(panelW / 2 - 24, panelH / 2 - 24, "Continue →", {
      fontSize: "14px", color: "#a8c89a", fontFamily: "Georgia, serif",
    }).setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => continueBtn.setColor("#f5c842"))
      .on("pointerout", () => continueBtn.setColor("#a8c89a"))
      .on("pointerdown", () => this.close());
    this.container.add(continueBtn);
  }

  private buildContextTag(): string | null {
    const parts: string[] = [];
    const tod = this.state.timeOfDay;
    if (tod === "dawn") parts.push("Dawn");
    else if (tod === "dusk") parts.push("Dusk");
    else if (tod === "night") parts.push("Night");
    if (this.state.weather === "storm") parts.push("Storm");
    else if (this.state.weather === "storm_approaching") parts.push("Storm approaching");
    if (this.state.season === "dry") parts.push("Dry season");
    return parts.length > 0 ? parts.join("  ·  ") : null;
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
