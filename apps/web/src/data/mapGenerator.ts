import type { RiverNode, RiverEdge } from "@igapo/shared";

interface RunMap { nodes: RiverNode[]; edges: RiverEdge[]; }

/**
 * Generates a single run's river map.
 * Handcrafted for the prototype; will become procedurally assembled from region pools.
 *
 * Layout (x, y) targets 1280×720 canvas — river flows left to right.
 */
export function generateRun(): RunMap {
  const nodes: RiverNode[] = [
    // Starting point
    {
      id: "start",
      name: "Porto Alegre do Rio",
      type: "town",
      region: "várzea",
      x: 140,
      y: 360,
      encounterId: "town_start",
    },
    // First branch options
    {
      id: "caiman_bank",
      name: "Caiman Banks",
      type: "wildlife",
      region: "várzea",
      x: 320,
      y: 260,
      encounterId: "wildlife_caiman",
    },
    {
      id: "varzea_village",
      name: "Vila Ribeirinha",
      type: "settlement",
      region: "várzea",
      x: 320,
      y: 460,
      encounterId: "human_village",
    },
    // Mid-river confluence
    {
      id: "flooded_forest",
      name: "Mata Alagada",
      type: "wildlife",
      region: "várzea",
      x: 520,
      y: 320,
      encounterId: "wildlife_boto",
    },
    {
      id: "loggers_camp",
      name: "Acampamento Madeireiro",
      type: "settlement",
      region: "terra_firme",
      x: 480,
      y: 520,
      encounterId: "human_extractivist",
    },
    // Second branch
    {
      id: "harpy_territory",
      name: "Alto das Gaviões",
      type: "discovery",
      region: "terra_firme",
      x: 700,
      y: 200,
      encounterId: "wildlife_harpy",
    },
    {
      id: "research_camp",
      name: "Acampamento da Pesquisa",
      type: "settlement",
      region: "várzea",
      x: 700,
      y: 400,
      encounterId: "human_researcher",
    },
    {
      id: "blackwater_tributary",
      name: "Igarapé Escuro",
      type: "navigation",
      region: "igapó",
      x: 680,
      y: 560,
      encounterId: "nav_blackwater",
    },
    // Deep reach
    {
      id: "otter_lake",
      name: "Lago das Lontras",
      type: "wildlife",
      region: "várzea",
      x: 880,
      y: 280,
      encounterId: "wildlife_otter",
    },
    {
      id: "deep_tributary",
      name: "Igarapé Sem Nome",
      type: "discovery",
      region: "igapó",
      x: 900,
      y: 480,
      encounterId: "discovery_hidden",
    },
    // Destination
    {
      id: "destination",
      name: "Estação Científica Várzea",
      type: "town",
      region: "várzea",
      x: 1100,
      y: 360,
      encounterId: "story_destination",
    },
  ];

  const edges: RiverEdge[] = [
    { from: "start", to: "caiman_bank" },
    { from: "start", to: "varzea_village" },
    { from: "caiman_bank", to: "flooded_forest" },
    { from: "varzea_village", to: "flooded_forest" },
    { from: "varzea_village", to: "loggers_camp" },
    { from: "flooded_forest", to: "harpy_territory" },
    { from: "flooded_forest", to: "research_camp" },
    { from: "loggers_camp", to: "research_camp" },
    { from: "loggers_camp", to: "blackwater_tributary" },
    { from: "harpy_territory", to: "otter_lake" },
    { from: "research_camp", to: "otter_lake" },
    { from: "research_camp", to: "deep_tributary" },
    { from: "blackwater_tributary", to: "deep_tributary" },
    { from: "otter_lake", to: "destination" },
    { from: "deep_tributary", to: "destination" },
  ];

  return { nodes, edges };
}
