import Phaser from "phaser";
import { Codex } from "../systems/Codex";
import { FIELD_NOTES_BY_ID } from "../data/encounterData";
import { META_FRAGMENTS } from "../data/metaFragments";

type Tab = "species" | "fragments" | "places" | "log";

const TABS: { id: Tab; label: string }[] = [
  { id: "species",   label: "Species" },
  { id: "fragments", label: "Zona Silenciosa" },
  { id: "places",    label: "Places" },
  { id: "log",       label: "Expedition Log" },
];

const KNOWN_PLACES: Record<string, { name: string; region: string; description: string }> = {
  start:               { name: "Porto Alegre do Rio",      region: "Várzea",      description: "The last town before the deep river. Fuel, food, rumor." },
  caiman_bank:         { name: "Banco dos Jacarés",        region: "Várzea",      description: "A mudflat where caimans thermoregulate. Navigation risk in nesting season." },
  varzea_village:      { name: "Vila Ribeirinha",          region: "Várzea",      description: "Four generations on this stretch. The elder knows what the river knows." },
  flooded_forest:      { name: "Mata Alagada",             region: "Várzea",      description: "Submerged forest in the wet season. Boto territory. Anacondas at dusk." },
  loggers_camp:        { name: "Acampamento Madeireiro",   region: "Terra Firme", description: "Chainsaw sounds from the tree line. The papers are mostly real." },
  trader_dock:         { name: "Atracadouro do Comerciante", region: "Várzea",    description: "A loaded boat mid-river. News travels on trading boats." },
  harpy_territory:     { name: "Alto das Gaviões",         region: "Terra Firme", description: "Emergent canopy. Harpy eagles. At dawn, possibly jaguars." },
  research_camp:       { name: "Acampamento da Pesquisa",  region: "Várzea",      description: "Dr. Ferreira's station. She is documenting a disappearance." },
  blackwater_tributary:{ name: "Igarapé Escuro",           region: "Igapó",       description: "Tannin-black water. Harder on engines. Unique species." },
  tapir_crossing:      { name: "Vau da Anta",              region: "Várzea",      description: "A shallow ford with large tracks. Tapirs cross at dawn and dusk." },
  otter_lake:          { name: "Lago das Lontras",         region: "Várzea",      description: "Giant river otters. Territorial. Arapaima in the wet season." },
  owl_roost:           { name: "Sítio do Mocho",           region: "Terra Firme", description: "Tall forest. Spectacled owl at night. Morpho butterflies at dawn." },
  deep_tributary:      { name: "Igarapé Sem Nome",         region: "Igapó",       description: "No map marks this. A concrete structure, half-swallowed. PROJETO SILÊNCIO." },
  destination:         { name: "Estação Científica Várzea", region: "Várzea",     description: "The research station at the end of the run. Someone has drawn a red circle." },
};

export class CodexScene extends Phaser.Scene {
  private codex = Codex.load();
  private activeTab: Tab = "species";
  private tabBtns: Map<Tab, Phaser.GameObjects.Text> = new Map();
  private contentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "CodexScene" });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(cx, height / 2, width, height, 0x060402);

    // Header
    this.add.text(cx, 24, "Field Codex", {
      fontSize: "26px", color: "#f5c842", fontFamily: "Georgia, serif", fontStyle: "italic",
    }).setOrigin(0.5);

    this.add.text(cx, 54, `${this.codex.totalRuns} expedition${this.codex.totalRuns !== 1 ? "s" : ""}  ·  ${this.codex.totalNotes} species documented  ·  ${this.codex.metaFragments.length}/5 fragments`, {
      fontSize: "11px", color: "#5a4a2a", fontFamily: "Georgia, serif", fontStyle: "italic",
    }).setOrigin(0.5);

    this.add.rectangle(cx, 72, width - 40, 1, 0x2a1e08);

    // Tabs
    TABS.forEach((tab, i) => {
      const x = cx - (TABS.length - 1) * 90 + i * 180;
      const btn = this.add.text(x, 88, tab.label, {
        fontSize: "13px",
        color: tab.id === this.activeTab ? "#f5c842" : "#5a4a2a",
        fontFamily: "Georgia, serif",
        letterSpacing: 2,
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => { if (tab.id !== this.activeTab) btn.setColor("#a09070"); })
        .on("pointerout", () => { if (tab.id !== this.activeTab) btn.setColor("#5a4a2a"); })
        .on("pointerdown", () => this.switchTab(tab.id));
      this.tabBtns.set(tab.id, btn);
    });

    this.add.rectangle(cx, 104, width - 40, 1, 0x2a1e08);

    // Content area
    this.contentContainer = this.add.container(0, 0);
    this.renderTab(this.activeTab);

    // Back button
    const backBtn = this.add.text(24, height - 24, "← Back", {
      fontSize: "13px", color: "#5a4a2a", fontFamily: "Georgia, serif",
    }).setOrigin(0, 1)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => backBtn.setColor("#a09070"))
      .on("pointerout", () => backBtn.setColor("#5a4a2a"))
      .on("pointerdown", () => this.scene.start("TitleScene"));
  }

  private switchTab(tab: Tab) {
    this.activeTab = tab;
    this.tabBtns.forEach((btn, id) => btn.setColor(id === tab ? "#f5c842" : "#5a4a2a"));
    this.contentContainer.destroy();
    this.contentContainer = this.add.container(0, 0);
    this.renderTab(tab);
  }

  private renderTab(tab: Tab) {
    switch (tab) {
      case "species":   this.renderSpecies(); break;
      case "fragments": this.renderFragments(); break;
      case "places":    this.renderPlaces(); break;
      case "log":       this.renderLog(); break;
    }
  }

  // ── Species ───────────────────────────────────────────────────────────────

  private renderSpecies() {
    const { width, height } = this.scale;
    const startY = 120;
    const colW = (width - 80) / 2;

    if (this.codex.allNoteIds.length === 0) {
      this.contentContainer.add(
        this.add.text(width / 2, height / 2, "No species documented yet.\nObserve carefully on your next expedition.", {
          fontSize: "14px", color: "#3a3020", fontFamily: "Georgia, serif",
          fontStyle: "italic", align: "center", lineSpacing: 8,
        }).setOrigin(0.5)
      );
      return;
    }

    this.codex.allNoteIds.forEach((id, i) => {
      const note = FIELD_NOTES_BY_ID[id];
      if (!note) return;

      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 40 + col * colW;
      const y = startY + row * 90;

      if (y + 90 > height - 40) return;

      const card = this.add.rectangle(x + colW / 2, y + 40, colW - 12, 80, 0x0d0a06)
        .setStrokeStyle(1, 0x2a1e08);
      this.contentContainer.add(card);

      this.contentContainer.add(
        this.add.text(x + 12, y + 8, `✦  ${note.species}`, {
          fontSize: "12px", color: "#f5c842", fontFamily: "Georgia, serif", fontStyle: "italic",
        }).setOrigin(0, 0)
      );

      this.contentContainer.add(
        this.add.text(x + 12, y + 26, note.text, {
          fontSize: "10px", color: "#7a6a48", fontFamily: "Georgia, serif",
          wordWrap: { width: colW - 28 }, lineSpacing: 3,
        }).setOrigin(0, 0)
      );
    });
  }

  // ── Fragments ─────────────────────────────────────────────────────────────

  private renderFragments() {
    const { width, height } = this.scale;
    const ALL_FRAGMENT_IDS = ["fragment_1", "fragment_2", "fragment_3", "fragment_4", "fragment_5"];
    const startY = 120;
    const entryH = 100;

    if (this.codex.metaFragments.length === 0) {
      this.contentContainer.add(
        this.add.text(width / 2, height / 2,
          "No fragments discovered yet.\n\nThe Zona Silenciosa surfaces through\nconversations and observations on the river.", {
          fontSize: "13px", color: "#3a3020", fontFamily: "Georgia, serif",
          fontStyle: "italic", align: "center", lineSpacing: 8,
        }).setOrigin(0.5)
      );
      return;
    }

    ALL_FRAGMENT_IDS.forEach((fid, i) => {
      const discovered = this.codex.metaFragments.includes(fid);
      const fragment = META_FRAGMENTS[fid];
      const y = startY + i * (entryH + 10);
      if (y + entryH > height - 40) return;

      const bgColor = discovered ? 0x0d0a06 : 0x060402;
      const borderColor = discovered ? (i === this.codex.metaFragments.length - 1 ? 0xc84040 : 0x3d2e0a) : 0x1a1208;

      this.contentContainer.add(
        this.add.rectangle(width / 2, y + entryH / 2, width - 80, entryH - 4, bgColor)
          .setStrokeStyle(1, borderColor)
      );

      const numColor = discovered ? "#c84040" : "#2a1e10";
      this.contentContainer.add(
        this.add.text(50, y + 10, `${i + 1}.`, {
          fontSize: "18px", color: numColor, fontFamily: "Georgia, serif",
        }).setOrigin(0, 0)
      );

      if (discovered && fragment) {
        this.contentContainer.add(
          this.add.text(74, y + 10, fragment.title, {
            fontSize: "13px", color: "#f5c842", fontFamily: "Georgia, serif", fontStyle: "italic",
          }).setOrigin(0, 0)
        );
        this.contentContainer.add(
          this.add.text(74, y + 28, `Source: ${fragment.source}`, {
            fontSize: "9px", color: "#5a4a2a", fontFamily: "Georgia, serif",
          }).setOrigin(0, 0)
        );
        this.contentContainer.add(
          this.add.text(74, y + 42, fragment.body, {
            fontSize: "10px", color: "#8a7a52", fontFamily: "Georgia, serif",
            wordWrap: { width: width - 140 }, lineSpacing: 3,
          }).setOrigin(0, 0)
        );
      } else {
        this.contentContainer.add(
          this.add.text(74, y + entryH / 2, "[ Not yet discovered ]", {
            fontSize: "11px", color: "#2a1e10", fontFamily: "Georgia, serif", fontStyle: "italic",
          }).setOrigin(0, 0.5)
        );
      }
    });

    // Teaser if all 5 found
    if (this.codex.metaFragments.length >= 5) {
      const y = startY + 5 * (entryH + 10) + 12;
      this.contentContainer.add(
        this.add.text(width / 2, y,
          "You have assembled the picture. The Zona Silenciosa is real, it is expanding,\nand someone needs to go in. In a future run, a new path will open.", {
          fontSize: "11px", color: "#c84040", fontFamily: "Georgia, serif",
          fontStyle: "italic", align: "center", lineSpacing: 5,
        }).setOrigin(0.5, 0)
      );
    }
  }

  // ── Places ────────────────────────────────────────────────────────────────

  private renderPlaces() {
    const { width, height } = this.scale;
    const startY = 120;
    const rowH = 52;
    const visited = this.codex.visitedNodeIds;

    if (visited.length === 0) {
      this.contentContainer.add(
        this.add.text(width / 2, height / 2, "No places visited yet.", {
          fontSize: "14px", color: "#3a3020", fontFamily: "Georgia, serif", fontStyle: "italic",
        }).setOrigin(0.5)
      );
      return;
    }

    Object.entries(KNOWN_PLACES).forEach(([id, place], i) => {
      const seen = visited.includes(id);
      const y = startY + i * rowH;
      if (y + rowH > height - 40) return;

      this.contentContainer.add(
        this.add.rectangle(width / 2, y + rowH / 2 - 2, width - 80, rowH - 6, seen ? 0x0d0a06 : 0x060402)
          .setStrokeStyle(1, seen ? 0x2a1e08 : 0x0e0b06)
      );

      const nameColor = seen ? "#c8b080" : "#2a1e10";
      const regionColor = seen ? "#5a4a2a" : "#1a1208";
      const descColor = seen ? "#6b5a34" : "#1a1208";

      this.contentContainer.add(
        this.add.text(50, y + 8, place.name, {
          fontSize: "12px", color: nameColor, fontFamily: "Georgia, serif",
        }).setOrigin(0, 0)
      );
      this.contentContainer.add(
        this.add.text(50, y + 26, `${place.region}  ·  ${place.description}`, {
          fontSize: "10px", color: descColor, fontFamily: "Georgia, serif",
          wordWrap: { width: width - 120 },
        }).setOrigin(0, 0)
      );

      if (!seen) {
        this.contentContainer.add(
          this.add.text(width - 50, y + rowH / 2 - 2, "not visited", {
            fontSize: "9px", color: "#1e1608", fontFamily: "Georgia, serif", fontStyle: "italic",
          }).setOrigin(1, 0.5)
        );
      } else {
        this.contentContainer.add(
          this.add.text(width - 50, y + rowH / 2 - 2, "✓", {
            fontSize: "11px", color: "#3a5a2a", fontFamily: "Georgia, serif",
          }).setOrigin(1, 0.5)
        );
      }
    });
  }

  // ── Log ───────────────────────────────────────────────────────────────────

  private renderLog() {
    const { width, height } = this.scale;
    const cx = width / 2;

    const stats: [string, string][] = [
      ["Expeditions made", `${this.codex.totalRuns}`],
      ["Species documented", `${this.codex.totalNotes}`],
      ["Locations visited", `${this.codex.visitedNodeIds.length} / ${Object.keys(KNOWN_PLACES).length}`],
      ["Destination reached", this.codex.destinationReached ? "Yes" : "Not yet"],
      ["Zona Silenciosa fragments", `${this.codex.metaFragments.length} / 5`],
    ];

    stats.forEach(([label, value], i) => {
      const y = 140 + i * 44;
      this.contentContainer.add(
        this.add.rectangle(cx, y, width - 80, 36, 0x0d0a06).setStrokeStyle(1, 0x1e1608)
      );
      this.contentContainer.add(
        this.add.text(cx - (width / 2 - 52), y, label, {
          fontSize: "13px", color: "#7a6a48", fontFamily: "Georgia, serif",
        }).setOrigin(0, 0.5)
      );
      this.contentContainer.add(
        this.add.text(cx + (width / 2 - 52), y, value, {
          fontSize: "14px", color: "#c8b080", fontFamily: "Georgia, serif",
        }).setOrigin(1, 0.5)
      );
    });

    // Reset button — for development
    const resetBtn = this.add.text(cx, height - 52, "Reset Codex (Dev)", {
      fontSize: "11px", color: "#2a1e10", fontFamily: "Georgia, serif",
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => resetBtn.setColor("#c84040"))
      .on("pointerout", () => resetBtn.setColor("#2a1e10"))
      .on("pointerdown", () => {
        Codex.reset();
        this.scene.restart();
      });
    this.contentContainer.add(resetBtn);
  }
}
