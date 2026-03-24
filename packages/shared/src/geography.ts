/**
 * Geography Layer
 *
 * The physical skeleton of the Amazon world. Generated once per player profile,
 * never modified during play. Defines WHERE things can be — not what is there.
 * Content (encounters, states) lives in the Event Log and Encounter Template Library.
 */

// ── Node and segment types ──────────────────────────────────────────────────

export type GeographyNodeType =
  | "open_water"        // no shore hub; transit only
  | "bank"              // shore hub slot possible
  | "fork"              // river divides; player chooses branch
  | "confluence"        // two branches rejoin; no choice
  | "port";             // always has a hub (start/end towns)

/**
 * What kind of encounter a bank node can host.
 * Set at map-generation time; fixed for the life of the player profile.
 */
export type HubSlotType =
  | "settlement_viable"
  | "wildlife_viable"
  | "navigation_viable"
  | "discovery_viable"
  | "story_viable";

// Region is the canonical type used across the whole codebase.
// Extends the existing várzea/igapó/terra_firme set with upper_river and confluence.
export type GeographyRegion =
  | "várzea"
  | "igapó"
  | "terra_firme"
  | "upper_river"
  | "confluence";

// ── Node schema ─────────────────────────────────────────────────────────────

export interface GeographyNode {
  id: string;                           // stable cross-run; e.g. "node_047"
  type: GeographyNodeType;
  region: GeographyRegion;
  position: { x: number; y: number };
  hubSlot?: HubSlotType;                // present only if type = "bank"
  isFork: boolean;
  leftBranchSegmentId?: string;         // only if isFork
  rightBranchSegmentId?: string;        // only if isFork
  forkGroupId?: string;                 // links fork → confluence
  segmentIds: string[];                 // edges connecting to this node
}

// ── Segment schema ───────────────────────────────────────────────────────────

export type SegmentWidth = "narrow" | "medium" | "wide" | "braided";
export type SegmentCurrentSpeed = "slow" | "moderate" | "fast" | "turbulent";

export interface RiverSegment {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  length: number;              // abstract units → fuel cost + scroll duration
  width: SegmentWidth;
  currentSpeed: SegmentCurrentSpeed;
  hazardBaseline: number;      // 0.0–1.0; base random encounter probability per unit
  region: GeographyRegion;
  branchId?: string;           // present if part of a fork branch
}

// ── Map generation config ────────────────────────────────────────────────────

export interface MapGenerationConfig {
  seed: number;
  totalLength: number;         // abstract units
  forkFrequency: number;       // average distance between fork nodes
  forkReunionDistance: number; // how far branches run before potentially rejoining
  hubSlotDensity: number;      // average distance between hub slots on a branch
  portCount: number;           // guaranteed town/port nodes
  regionSequence: GeographyRegion[];
}

// ── Persisted geography snapshot ─────────────────────────────────────────────

/**
 * The full persisted world map for a player profile.
 * Written once at profile creation; read every run.
 */
export interface GeographySnapshot {
  config: MapGenerationConfig;
  nodes: GeographyNode[];
  segments: RiverSegment[];
  startNodeId: string;
  destinationNodeIds: string[]; // nodes that can resolve missions
}

// ── Legacy bridge ────────────────────────────────────────────────────────────

/**
 * Maps the existing static 17-node RiverNode IDs to their GeographyNode
 * hub slot types. Used by the World Population Engine while the legacy
 * mapGenerator is still in use.
 */
export const LEGACY_NODE_HUB_SLOTS: Record<string, HubSlotType> = {
  start:                "story_viable",
  caiman_bank:          "wildlife_viable",
  varzea_village:       "settlement_viable",
  flooded_forest:       "wildlife_viable",
  loggers_camp:         "settlement_viable",
  trader_dock:          "settlement_viable",
  harpy_territory:      "wildlife_viable",
  research_camp:        "settlement_viable",
  blackwater_tributary: "navigation_viable",
  tapir_crossing:       "wildlife_viable",
  otter_lake:           "wildlife_viable",
  owl_roost:            "wildlife_viable",
  deep_tributary:       "discovery_viable",
  destination:          "story_viable",
};
