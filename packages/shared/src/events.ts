export type EventTag =
  | "human"
  | "wildlife"
  | "navigation"
  | "discovery"
  | "medical"
  | "positive_community"
  | "negative_community"
  | "node_visited"
  | "run_end";

export interface WorldEffect {
  target: { type: "node"; nodeId: string } | { type: "region"; regionId: string };
  attribute: string;
  delta: number;
}

export interface WorldEvent {
  id: string;
  runId: number;
  turn: number;
  nodeId: string;
  archetypeId: string;
  eventType: "encounter_outcome" | "node_visited" | "run_end";
  encounterId?: string;
  choiceId?: string;
  outcome?: "success" | "failure" | "neutral";
  effects: WorldEffect[];
  tags: string[];
}

export interface DerivedNodeState {
  nodeId: string;
  community_trust: number;
  visit_count: number;
  has_medical_history: boolean;
  ecological_health: number;  // clamped 0 to +10; decays 20%/run; boosted by wildlife observation
}
