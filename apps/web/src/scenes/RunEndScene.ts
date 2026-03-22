import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { Codex } from "../systems/Codex";

interface RunEndData {
  state: GameState;
  reason?: "destination" | "fuel" | "food" | "morale";
}

const GROWN_TRAIT_LABELS: Record<string, string> = {
  storm_tested:   "Storm-Tested",
  apex_observer:  "Apex Observer",
  night_reader:   "Night Reader",
  bridge_builder: "Bridge Builder",
};

const STARTING_TRAIT_IDS = new Set([
  "expert_navigator", "superstitious", "wildlife_eye", "bad_with_people",
  "engine_sense", "anxious_in_storms", "community_trust", "distrusts_researchers",
]);

export class RunEndScene extends Phaser.Scene {
  private state!: GameState;
  private reason!: string;

  constructor() {
    super({ key: "RunEndScene" });
  }

  init(data: RunEndData) {
    this.state = data.state;
    this.reason = data.reason ?? "destination";
    Codex.recordRun(this.state);
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(cx, height / 2, width, height, 0x060402);

    const reached = this.reason === "destination";

    // Header
    this.add.text(cx, 48, reached ? "Expedition Complete" : "Expedition Ended", {
      fontSize: "28px",
      color: reached ? "#f5c842" : "#c84040",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
    }).setOrigin(0.5);

    const subtitle = {
      destination: "You reached the station. The river gave you what it chose to give.",
      fuel: "The engine died somewhere no one comes. The expedition ends here.",
      food: "The crew could not continue. The river asks more than you had.",
      morale: "The crew dispersed at the last stop. Some expeditions end before they end.",
    }[this.reason] ?? "";

    this.add.text(cx, 86, subtitle, {
      fontSize: "13px",
      color: "#7a6a48",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      wordWrap: { width: 700 },
      align: "center",
    }).setOrigin(0.5);

    this.add.rectangle(cx, 112, 700, 1, 0x3d2e0a);

    // Three-column layout: resources | field notes | archetype mechanic
    this.drawResourceSummary(cx - 340, 124);
    this.drawFieldNotes(cx - 40, 124);
    this.drawArchetypeSummary(cx + 260, 124);

    // Crew summary with growth indicators
    this.drawCrewSummary(cx, 400);

    // Codex footer
    const codex = Codex.load();
    this.add.text(cx, 490,
      `${codex.totalRuns} expedition${codex.totalRuns !== 1 ? "s" : ""}  ·  ${codex.totalNotes} species documented  ·  ${codex.metaFragments.length}/8 fragments`,
      {
        fontSize: "11px", color: "#4a3820", fontFamily: "Georgia, serif", fontStyle: "italic",
      }).setOrigin(0.5);

    if (codex.metaFragments.length > 0) {
      this.add.text(cx, 510,
        `Zona Silenciosa: ${codex.metaFragments.length} / 5`, {
        fontSize: "10px",
        color: codex.metaFragments.length >= 8 ? "#c84040" : codex.metaFragments.length >= 5 ? "#7a4a2a" : "#3a2a1a",
        fontFamily: "Georgia, serif",
        letterSpacing: 2,
      }).setOrigin(0.5);
    }

    this.add.rectangle(cx, 534, 700, 1, 0x3d2e0a);

    // Actions
    const newRunBtn = this.add.text(cx - 80, 568, "New Expedition →", {
      fontSize: "16px", color: "#a8c89a", fontFamily: "Georgia, serif",
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => newRunBtn.setColor("#f5c842"))
      .on("pointerout", () => newRunBtn.setColor("#a8c89a"))
      .on("pointerdown", () => this.scene.start("ArchetypeScene"));

    const titleBtn = this.add.text(cx + 120, 568, "← Title", {
      fontSize: "14px", color: "#5a4a2a", fontFamily: "Georgia, serif",
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => titleBtn.setColor("#a09070"))
      .on("pointerout", () => titleBtn.setColor("#5a4a2a"))
      .on("pointerdown", () => this.scene.start("TitleScene"));
  }

  // ── Resource summary ────────────────────────────────────────────────────────

  private drawResourceSummary(x: number, startY: number) {
    this.add.text(x + 70, startY, "RESOURCES", {
      fontSize: "9px", color: "#4a3820", fontFamily: "Georgia, serif", letterSpacing: 3,
    }).setOrigin(0.5, 0);

    const bars: [string, number][] = [
      ["Fuel", this.state.resources.fuel],
      ["Food", this.state.resources.food],
      ["Medicine", this.state.resources.medicine],
      ["Equipment", this.state.resources.equipment],
      ["Morale", this.state.resources.morale],
    ];

    bars.forEach(([label, val], i) => {
      const y = startY + 20 + i * 24;
      const pct = val / 100;
      const color = pct > 0.5 ? "#6ab04c" : pct > 0.2 ? "#e8a020" : "#c84040";

      this.add.text(x, y, label, {
        fontSize: "11px", color: "#8a7a52", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0.5);

      this.add.rectangle(x + 62, y, 90, 6, 0x1e1a10).setOrigin(0, 0.5);
      this.add.rectangle(x + 62, y, Math.max(1, 90 * pct), 6, parseInt(color.slice(1), 16)).setOrigin(0, 0.5);
      this.add.text(x + 156, y, `${Math.round(val)}`, {
        fontSize: "10px", color: "#5a4a2a", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0.5);
    });

    this.add.text(x + 70, startY + 20 + 5 * 24 + 8,
      `${this.state.dayNumber} day${this.state.dayNumber !== 1 ? "s" : ""} on the river`, {
      fontSize: "10px", color: "#4a3820", fontFamily: "Georgia, serif", fontStyle: "italic",
    }).setOrigin(0.5, 0);
  }

  // ── Field notes panel ────────────────────────────────────────────────────────

  private drawFieldNotes(x: number, startY: number) {
    const notes = this.state.fieldNotes;

    this.add.text(x + 140, startY, `FIELD NOTES  (${notes.length})`, {
      fontSize: "9px", color: "#4a3820", fontFamily: "Georgia, serif", letterSpacing: 3,
    }).setOrigin(0.5, 0);

    if (notes.length === 0) {
      this.add.text(x, startY + 22, "None collected this run.", {
        fontSize: "12px", color: "#3a3020", fontFamily: "Georgia, serif", fontStyle: "italic",
      }).setOrigin(0, 0);
      return;
    }

    notes.slice(0, 6).forEach((note, i) => {
      const y = startY + 22 + i * 34;
      this.add.text(x, y, `✦ ${note.species}`, {
        fontSize: "11px", color: "#f5c842", fontFamily: "Georgia, serif", fontStyle: "italic",
      }).setOrigin(0, 0);
      this.add.text(x, y + 13, note.text, {
        fontSize: "9px", color: "#6b5a34", fontFamily: "Georgia, serif",
        wordWrap: { width: 280 },
      }).setOrigin(0, 0);
    });

    if (notes.length > 6) {
      this.add.text(x, startY + 22 + 6 * 34, `…and ${notes.length - 6} more`, {
        fontSize: "10px", color: "#3a3020", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0);
    }
  }

  // ── Archetype mechanic summary ──────────────────────────────────────────────

  private drawArchetypeSummary(x: number, startY: number) {
    const codex = Codex.load();
    const archId = this.state.archetypeId;

    const mechanicName: Record<string, string> = {
      naturalist:   "SPECIMEN JOURNAL",
      correspondent: "SOURCE NETWORK",
      river_guide:  "NAVIGATOR'S LOG",
      medic:        "CLINIC REPUTATION",
    };

    this.add.text(x + 80, startY, mechanicName[archId] ?? "ARCHETYPE", {
      fontSize: "9px", color: "#4a3820", fontFamily: "Georgia, serif", letterSpacing: 3,
    }).setOrigin(0.5, 0);

    const lineH = 22;
    let lineY = startY + 20;

    const addLine = (label: string, value: string, valueColor = "#c8b080") => {
      this.add.text(x, lineY, label, {
        fontSize: "11px", color: "#6b5a34", fontFamily: "Georgia, serif",
      }).setOrigin(0, 0);
      this.add.text(x + 158, lineY, value, {
        fontSize: "11px", color: valueColor, fontFamily: "Georgia, serif",
      }).setOrigin(1, 0);
      lineY += lineH;
    };

    switch (archId) {
      case "naturalist":
        addLine("Specimens this run", `${this.state.specimenCount}`);
        addLine("Best run ever", `${codex.naturalistSpecimenBest}`);
        addLine("Grants received", `${this.state.specimenGrantLevel}`, "#6ab04c");
        addLine("Total grants (all runs)", `${codex.naturalistGrantsTotal}`, "#6ab04c");
        if (this.state.specimenCount >= 3) {
          lineY += 6;
          this.add.text(x, lineY, "Grant funding supported this expedition.", {
            fontSize: "10px", color: "#6ab04c", fontFamily: "Georgia, serif", fontStyle: "italic",
            wordWrap: { width: 160 },
          }).setOrigin(0, 0);
        }
        break;

      case "correspondent":
        addLine("Radio tips generated", `${this.state.radioTips.length}`);
        addLine("Total tips (all runs)", `${codex.correspondentTipsTotal}`);
        if (this.state.radioTips.length > 0) {
          lineY += 6;
          this.add.text(x, lineY, "Last transmission:", {
            fontSize: "9px", color: "#5a4a2a", fontFamily: "Georgia, serif", fontStyle: "italic",
          }).setOrigin(0, 0);
          lineY += 14;
          const lastTip = this.state.radioTips[this.state.radioTips.length - 1];
          this.add.text(x, lineY, lastTip, {
            fontSize: "9px", color: "#7a9aaa", fontFamily: "Georgia, serif", fontStyle: "italic",
            wordWrap: { width: 160 }, lineSpacing: 2,
          }).setOrigin(0, 0);
        }
        break;

      case "river_guide":
        addLine("Nodes visited", `${this.state.visitedNodeIds.size}`);
        addLine("Moves made", `${this.state.moveCount}`);
        addLine("Reveal depth", "2 nodes ahead", "#4a9ade");
        addLine("Hidden routes found",
          this.state.visitedNodeIds.has("deep_tributary") ? "Yes — Igarapé Sem Nome" : "None",
          this.state.visitedNodeIds.has("deep_tributary") ? "#f5c842" : "#4a3820");
        break;

      case "medic":
        addLine("Clinics run this expedition", `${this.state.healedCommunities.size}`);
        addLine("Total clinics (all runs)", `${codex.medicClinicRunsTotal}`);
        addLine("Unique communities healed", `${codex.medicHealedCommunities.length}`, "#4a9ade");
        if (this.state.healedCommunities.size > 0) {
          lineY += 6;
          this.add.text(x, lineY, "Word of your work travels.", {
            fontSize: "10px", color: "#a8c89a", fontFamily: "Georgia, serif", fontStyle: "italic",
          }).setOrigin(0, 0);
        }
        break;
    }
  }

  // ── Crew summary with growth indicators ────────────────────────────────────

  private drawCrewSummary(cx: number, startY: number) {
    if (!this.state.crew.length) return;

    this.add.text(cx, startY, "CREW", {
      fontSize: "9px", color: "#4a3820", fontFamily: "Georgia, serif", letterSpacing: 4,
    }).setOrigin(0.5);

    this.state.crew.forEach((member, i) => {
      const tx = cx + (i - (this.state.crew.length - 1) / 2) * 300;

      this.add.text(tx, startY + 18, member.name, {
        fontSize: "13px", color: "#c8b080", fontFamily: "Georgia, serif",
      }).setOrigin(0.5);
      this.add.text(tx, startY + 34, member.role, {
        fontSize: "10px", color: "#6b5a34", fontFamily: "Georgia, serif",
      }).setOrigin(0.5);

      // Show any evolved traits
      const grownTraits = member.traits.filter(t => !STARTING_TRAIT_IDS.has(t.id));
      if (grownTraits.length > 0) {
        grownTraits.forEach((t, j) => {
          this.add.text(tx, startY + 50 + j * 14, `✦ ${GROWN_TRAIT_LABELS[t.id] ?? t.label}`, {
            fontSize: "9px", color: "#6ab04c", fontFamily: "Georgia, serif", fontStyle: "italic",
          }).setOrigin(0.5);
        });
      }
    });
  }
}
