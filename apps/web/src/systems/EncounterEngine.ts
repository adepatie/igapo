import Phaser from "phaser";
import type { EncounterNode, EncounterChoice, Resources, DerivedNodeState } from "@igapo/shared";
import { GameState } from "./GameState";
import { resolveOutcome, ENCOUNTERS, CHOICE_WORLD_EFFECTS } from "../data/encounterData";
import { computeBonuses, applySuccessBonus, type ActiveBonuses } from "./BonusSystem";
import { Codex } from "./Codex";

// Table-driven world-state variant selection.
// Variants are evaluated in order; first match wins.
interface VariantMapping {
  baseEncounterId: string;
  variantId: string;
  condition: (nodeState: DerivedNodeState | undefined) => boolean;
}

const WORLD_STATE_VARIANTS: VariantMapping[] = [
  {
    baseEncounterId: "human_village",
    variantId: "human_village_return",
    condition: (s) => s?.has_medical_history === true,
  },
  {
    baseEncounterId: "human_extractivist",
    variantId: "human_extractivist_challenged",
    condition: (s) => (s?.community_trust ?? 0) < -1,
  },
  {
    baseEncounterId: "human_trader",
    variantId: "human_trader_familiar",
    condition: (s) => (s?.visit_count ?? 0) >= 1,
  },
  {
    baseEncounterId: "wildlife_caiman",
    variantId: "wildlife_caiman_known_route",
    condition: (s) => (s?.visit_count ?? 0) >= 1,
  },
  {
    baseEncounterId: "wildlife_boto",
    variantId: "wildlife_boto_curious",
    condition: (s) => (s?.ecological_health ?? 0) >= 1,
  },
  {
    baseEncounterId: "nav_blackwater",
    variantId: "nav_blackwater_charted",
    condition: (s) => (s?.visit_count ?? 0) >= 1,
  },
];

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
    {
      id: "_bonus_run_clinic",
      label: "Offer to run a brief clinic. You have the supplies.",
      successChance: 1.0,
    },
  ],
};

// Node encounters considered as apex predator observations (Apex Observer growth)
const APEX_PREDATOR_ENCOUNTERS = new Set([
  "caiman_encounter", "harpy_territory", "jaguar_sighting", "flooded_forest",
]);

// Radio tip messages keyed by node id (for Correspondent Source Network)
const RADIO_TIPS: Record<string, string> = {
  caiman_bank:          "Radio: local fisher warns — caimans are nesting near the next bank. Go slow.",
  varzea_village:       "Radio: someone upstream mentioned a village with a broken engine. They might need a medic.",
  flooded_forest:       "Radio: atmospheric crackle, then a voice: 'don't anchor near the submerged trees after dark.'",
  loggers_camp:         "Radio: a brief, businesslike transmission. Logging operation nearby. Papers, apparently, are mostly in order.",
  trader_dock:          "Radio: a trading boat is anchored mid-river. They're carrying fuel.",
  harpy_territory:      "Radio: brief static, then: 'something big in the canopy at the next fork. I'd stop and look.'",
  research_camp:        "Radio: Dr. Ferreira's frequency. She sounds tired. 'Come by if you can. I have data I don't want to transmit.'",
  blackwater_tributary: "Radio: distortion, then fragments: '—water's black here, engine runs rough—current reversal—'",
  tapir_crossing:       "Radio: nothing intelligible, but the signal spikes at the right frequency. Something crossing.",
  otter_lake:           "Radio: a guide's voice, amused: 'otters again. Whole family. They'll give you trouble if you idle too long.'",
  owl_roost:            "Radio: nothing from this direction — but the birds went quiet.",
  deep_tributary:       "Radio: an old frequency, years out of date. Someone's still using it. The message loops.",
  destination:          "Radio: clear signal. The research station is transmitting. They're expecting someone.",
};

export class EncounterEngine {
  private scene: Phaser.Scene;
  private node: EncounterNode;
  private state: GameState;
  private bonuses: ActiveBonuses;
  private container!: Phaser.GameObjects.Container;
  private choiceButtons: Phaser.GameObjects.Text[] = [];
  private phase: "arrival" | "choice" | "outcome" = "arrival";
  private _specimenGrantFired: boolean = false;

  constructor(scene: Phaser.Scene, node: EncounterNode, state: GameState) {
    this.scene = scene;
    this.node = node;
    this.state = state;
    this.bonuses = computeBonuses(state);
  }

  create() {
    // ── World-state variant selection ─────────────────────────────────────
    const nodeState = this.state.derivedNodeStates[this.state.currentNodeId];
    for (const mapping of WORLD_STATE_VARIANTS) {
      if (this.node.id === mapping.baseEncounterId && mapping.condition(nodeState)) {
        this.node = ENCOUNTERS[mapping.variantId] ?? this.node;
        break;
      }
    }

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

    // ── Medic: Safe Harbor — returning to a previously healed community ─────
    if (this.state.archetypeId === "medic" && this.node.type === "human") {
      const prevHealed = Codex.load().medicHealedCommunities;
      if (prevHealed.includes(this.node.id)) {
        // Apply silent resource bonus on arrival
        this.state.resources.medicine = Math.min(100, this.state.resources.medicine + 12);
        this.state.resources.morale   = Math.min(100, this.state.resources.morale   + 8);
        // Show safe harbor banner
        this.container.add(
          this.scene.add.text(panelW / 2 - 28, -panelH / 2 + 14,
            "◆ Safe Harbor", {
            fontSize: "9px", color: "#4a9ade", fontFamily: "Georgia, serif", letterSpacing: 2,
          }).setOrigin(1, 0)
        );
      }
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
      // Medic: offer to run clinic if they have medicine to spare
      if (this.state.archetypeId === "medic" && this.state.resources.medicine >= 15) {
        injected.push(BONUS_CHOICES.human[2]);
      }
    }

    // Filter injected: don't duplicate ids
    const existingIds = new Set(available.map(c => c.id));
    const filteredInjected = injected.filter(c => !existingIds.has(c.id));

    const allChoices = [...available, ...filteredInjected];
    // Adjust startY upward if many choices to prevent overflow
    const choiceAreaH = allChoices.length * 40 + locked.slice(0, 1).length * 38;
    const startY = Math.min(panelH / 2 - 175, panelH / 2 - choiceAreaH - 20);

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

    // Track choice in codexEntries for meta-fragment triggers
    this.state.codexEntries.add(choice.id);

    // Apply archetype/crew success bonus
    const adjustedChance = applySuccessBonus(
      choice.successChance ?? 1.0,
      this.node.type,
      this.bonuses
    );
    const adjustedChoice = { ...choice, successChance: adjustedChance };

    // Bonus choice outcomes
    if (choice.id === "_bonus_careful_observe") {
      this.recordChoiceEvent("_bonus_careful_observe", "success");
      this.showOutcomeText(panelW, panelH, {
        text: "You settle into methodical observation. The animal — whatever its initial wariness — adjusts to your presence. You document behavior that a faster approach would have disrupted.",
        resourceDelta: { morale: 8 },
      }, {});
      return;
    }
    if (choice.id === "_bonus_press_further") {
      const success = Math.random() < adjustedChance;
      this.recordChoiceEvent("_bonus_press_further", success ? "success" : "failure");
      this.showOutcomeText(panelW, panelH, {
        text: success
          ? "You read the hesitation correctly. There is more — and they tell you, carefully, in the way people tell things to someone they've decided they can probably trust."
          : "You pushed too soon. The conversation closes. You leave with the feeling that you had it, briefly, and lost it.",
        resourceDelta: success ? {} : { morale: -8 },
      }, {});
      return;
    }
    if (choice.id === "_bonus_trust_intro") {
      this.recordChoiceEvent("_bonus_trust_intro", "success");
      this.showOutcomeText(panelW, panelH, {
        text: "The introduction lands. Your work is known here — or at least, the kind of work it is. The conversation that follows is longer and more honest than you expected.",
        resourceDelta: { morale: 10 },
      }, {});
      return;
    }
    if (choice.id === "_bonus_run_clinic") {
      this.state.healedCommunities.add(this.node.id);
      this.recordChoiceEvent("_bonus_run_clinic", "success");
      this.showOutcomeText(panelW, panelH, {
        text: "You set up a makeshift clinic for two hours. Wound care, rehydration salts, a child's fever reduced. You leave behind more than medicine — you leave behind an account of who you are. Word travels faster than boats on this river.",
        resourceDelta: { medicine: -15, morale: 20 },
      }, {});
      return;
    }

    const outcome = resolveOutcome(adjustedChoice, this.state);

    // Record world event for this choice (effects looked up from CHOICE_WORLD_EFFECTS)
    this.recordChoiceEvent(choice.id, "neutral");

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

    // ── Naturalist: Specimen Journal ─────────────────────────────────────
    if (outcome.fieldNote && this.node.type === "wildlife" && this.state.archetypeId === "naturalist") {
      this.state.specimenCount++;
      const level = Math.floor(this.state.specimenCount / 3);
      if (level > this.state.specimenGrantLevel) {
        this.state.specimenGrantLevel = level;
        // Grant funding arrives
        this.state.resources.fuel  = Math.min(100, this.state.resources.fuel  + 20);
        this.state.resources.food  = Math.min(100, this.state.resources.food  + 15);
        this.state.resources.morale = Math.min(100, this.state.resources.morale + 10);
        deltas.fuel  = (deltas.fuel  ?? 0) + 20;
        deltas.food  = (deltas.food  ?? 0) + 15;
        deltas.morale = (deltas.morale ?? 0) + 10;
        this._specimenGrantFired = true;
      }
    }

    // ── Crew growth: check evolution conditions ───────────────────────────
    this.checkCrewGrowth(outcome);

    const divY = -panelH / 2 + 68;

    this.container.add(this.scene.add.rectangle(0, divY + 110, panelW - 48, 1, 0x2a1e08));

    let notifLines = 0;
    if (outcome.fieldNote) {
      const flash = this.scene.add.text(0, divY + 122, "✦ Field Note Gained", {
        fontSize: "11px", color: "#f5c842", fontFamily: "Georgia, serif", letterSpacing: 2,
      }).setOrigin(0.5, 0);
      this.container.add(flash);
      this.scene.tweens.add({ targets: flash, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });
      notifLines++;
    }
    if (this._specimenGrantFired) {
      const grantY = divY + 122 + notifLines * 18;
      const grantFlash = this.scene.add.text(0, grantY,
        `✦ Specimen Journal — funding received  (${this.state.specimenCount} specimens)`, {
        fontSize: "10px", color: "#6ab04c", fontFamily: "Georgia, serif", letterSpacing: 1,
      }).setOrigin(0.5, 0);
      this.container.add(grantFlash);
      this.scene.tweens.add({ targets: grantFlash, alpha: 0.3, duration: 1200, yoyo: true, repeat: -1 });
      notifLines++;
    }

    const outcomeStart = divY + (notifLines > 0 ? 122 + notifLines * 18 + 8 : 126);
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

  // Records a WorldEvent for a resolved encounter choice.
  // Looks up world-state effects from CHOICE_WORLD_EFFECTS; substitutes the
  // current node/region into the target. Safe to call for any encounter type —
  // choices absent from the map produce an event with no effects (still useful
  // for building visit/encounter history).
  private recordChoiceEvent(choiceId: string, outcome: "success" | "failure" | "neutral") {
    const rawEffects = CHOICE_WORLD_EFFECTS[choiceId] ?? [];
    const effects = rawEffects.map(e => ({
      target: e.scope === "node"
        ? { type: "node" as const, nodeId: this.state.currentNodeId }
        : { type: "region" as const, regionId: "várzea" as const }, // placeholder — real regionId populated when geography layer is active
      attribute: e.attribute,
      delta: e.delta,
    }));

    this.state.recordEvent({
      nodeId: this.state.currentNodeId,
      archetypeId: this.state.archetypeId,
      eventType: "encounter_outcome",
      encounterId: this.node.id,
      choiceId,
      outcome,
      effects,
      tags: [this.node.type],
    });
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

  // ── Crew growth: trait evolution ─────────────────────────────────────────
  private checkCrewGrowth(outcome: { resourceDelta?: Partial<Resources> }) {
    for (const member of this.state.crew) {
      switch (member.id) {
        case "raimundo": {
          // Storm-Tested: survive a navigation encounter in storm without morale collapse
          const inStorm = this.node.type === "navigation" && this.state.weather === "storm";
          const hasTrait = member.traits.some(t => t.id === "anxious_in_storms");
          if (inStorm && hasTrait && this.state.resources.morale > 20) {
            member.traits = member.traits.filter(t => t.id !== "anxious_in_storms");
            member.traits.push({
              id: "storm_tested",
              label: "Storm-Tested",
              description: "Raimundo has faced the worst and held. No more storm morale penalty.",
            });
            this._crewGrowthMessages.push(`${member.name} — Anxious in Storms → Storm-Tested`);
          }
          break;
        }
        case "dr_melo": {
          // Apex Observer: encounter an apex predator node
          const isApex = APEX_PREDATOR_ENCOUNTERS.has(this.node.id);
          const hasObserver = member.traits.some(t => t.id === "apex_observer");
          if (isApex && !hasObserver && outcome.resourceDelta) {
            member.traits.push({
              id: "apex_observer",
              label: "Apex Observer",
              description: "Having documented apex predators, Dr. Melo's wildlife observations carry greater authority.",
            });
            this._crewGrowthMessages.push(`${member.name} — gained Apex Observer`);
          }
          break;
        }
        case "solange": {
          // Night Reader: survive a night encounter without morale collapse
          const isNight = this.state.timeOfDay === "night";
          const hasSuperstitious = member.traits.some(t => t.id === "superstitious");
          if (isNight && hasSuperstitious && this.state.resources.morale > 25) {
            member.traits = member.traits.filter(t => t.id !== "superstitious");
            member.traits.push({
              id: "night_reader",
              label: "Night Reader",
              description: "Solange has made peace with the night river. No more igapó penalty.",
            });
            this._crewGrowthMessages.push(`${member.name} — Superstitious → Night Reader`);
          }
          break;
        }
        case "catarina": {
          // Bridge Builder: successfully navigate a human community encounter
          const isCommunity = this.node.type === "human";
          const hasBridge = member.traits.some(t => t.id === "bridge_builder");
          // Only grant after notable success (morale didn't drop in a human encounter)
          const moraleGained = (outcome.resourceDelta?.morale ?? 0) > 0;
          if (isCommunity && !hasBridge && moraleGained) {
            member.traits.push({
              id: "bridge_builder",
              label: "Bridge Builder",
              description: "Catarina's network deepens. Human encounters start with better trust.",
            });
            this._crewGrowthMessages.push(`${member.name} — gained Bridge Builder`);
          }
          break;
        }
      }
    }
  }

  private close() {
    // ── Correspondent: Source Network — generate radio tip ─────────────────
    if (this.state.archetypeId === "correspondent" && this.node.type === "human") {
      const allNodeIds = Object.keys(RADIO_TIPS);
      const unvisited = allNodeIds.filter(id =>
        !this.state.visitedNodeIds.has(id) && !this.state.radioTipNodeIds.has(id)
      );
      if (unvisited.length > 0) {
        const tipNodeId = unvisited[Math.floor(Math.random() * Math.min(3, unvisited.length))];
        const tip = RADIO_TIPS[tipNodeId];
        if (tip) {
          this.state.radioTips.push(tip);
          this.state.radioTipNodeIds.add(tipNodeId);
        }
      }
    }

    this.container.destroy();

    // Show crew growth notifications if any, then close
    if (this._crewGrowthMessages.length > 0) {
      this._showCrewGrowthNotice();
    } else {
      this.scene.scene.stop("EncounterScene");
      this.scene.scene.resume("MapScene");
    }
  }

  private _crewGrowthMessages: string[] = [];

  private _showCrewGrowthNotice() {
    const { width, height } = this.scene.scale;
    const notice = this.scene.add.container(width / 2, height / 2);

    const bg = this.scene.add.rectangle(0, 0, 420, 80 + this._crewGrowthMessages.length * 22, 0x0a0705, 0.96)
      .setStrokeStyle(1, 0x6ab04c);
    notice.add(bg);

    notice.add(this.scene.add.text(0, -30, "CREW GROWTH", {
      fontSize: "10px", color: "#6ab04c", fontFamily: "Georgia, serif", letterSpacing: 4,
    }).setOrigin(0.5));

    this._crewGrowthMessages.forEach((msg, i) => {
      notice.add(this.scene.add.text(0, -10 + i * 22, msg, {
        fontSize: "12px", color: "#c8b080", fontFamily: "Georgia, serif", fontStyle: "italic",
      }).setOrigin(0.5));
    });

    const cont = this.scene.add.text(0, 20 + this._crewGrowthMessages.length * 22, "Continue →", {
      fontSize: "13px", color: "#a8c89a", fontFamily: "Georgia, serif",
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        notice.destroy();
        cont.destroy();
        this.scene.scene.stop("EncounterScene");
        this.scene.scene.resume("MapScene");
      });
    notice.add(cont);
  }
}
