import { applyEncounter, randomEncounter } from "./events.js";

const ROUTE = [
  {
    id: "loreto",
    name: "Loreto Dock",
    biome: "riverside town",
    description: "A bustling hub where the Amazon's many tributaries converge.",
  },
  {
    id: "nauta",
    name: "Nauta Rapids",
    biome: "whitewater passage",
    description:
      "Churning waters test your skill as the river narrows through rocky channels.",
  },
  {
    id: "selva",
    name: "Selva Floodplains",
    biome: "lush wetlands",
    description: "Waterlogged forests teeming with birdcalls and caiman eyes.",
  },
  {
    id: "pacaya",
    name: "Pacaya-Samiria Reserve",
    biome: "protected wilderness",
    description:
      "The 'Jungle of Mirrors' - flooded forests reflecting endless sky.",
  },
  {
    id: "yanayacu",
    name: "Yanayacu Bend",
    biome: "blackwater lagoon",
    description: "Inky waters reflect constellations even at midday.",
  },
  {
    id: "iquitos",
    name: "Iquitos Outpost",
    biome: "riverside settlement",
    description:
      "A remote trading post where river folk share stories and supplies.",
  },
  {
    id: "manu",
    name: "Manu Canopy",
    biome: "towering jungle",
    description:
      "Macaws flare overhead as howler monkeys announce your arrival.",
  },
  {
    id: "tambopata",
    name: "Tambopata Clay Lick",
    biome: "parrot gathering site",
    description:
      "Hundreds of parrots descend on mineral-rich clay banks in a riot of color.",
  },
  {
    id: "madeira",
    name: "Madeira Confluence",
    biome: "river junction",
    description:
      "Two great rivers merge in a swirling dance of brown and blue waters.",
  },
  {
    id: "santarem",
    name: "Santarém Meeting of Waters",
    biome: "natural phenomenon",
    description:
      "The Amazon and Tapajós rivers flow side-by-side without mixing for miles.",
  },
  {
    id: "altar",
    name: "Altar do Chão",
    biome: "white sand beaches",
    description: "Caribbean-like beaches hidden deep in the rainforest.",
  },
  {
    id: "para",
    name: "Pará Estuary",
    biome: "tidal delta",
    description:
      "The river widens into a shimmering horizon. The legendary flower awaits.",
  },
];

const BASE_ACTIONS = [
  {
    id: "paddle",
    label: "Paddle downstream",
    description: "Push harder to cover more distance at the cost of stamina.",
    deltas: { progress: +1, stamina: -8, supplies: -4 },
  },
  {
    id: "forage",
    label: "Forage along the banks",
    description: "Search for fruits, fish, and medicinal herbs.",
    deltas: { supplies: +10, stamina: -4, morale: +2 },
  },
  {
    id: "camp",
    label: "Set up camp early",
    description: "Rest, repair gear, and recover morale.",
    deltas: { stamina: +8, morale: +6, supplies: -6 },
  },
  {
    id: "scout",
    label: "Scout ahead",
    description: "Explore upcoming bends for hazards and hidden routes.",
    deltas: { morale: +3, stamina: -3 },
  },
];

export const createInitialState = (playerName = "Explorer") => ({
  playerName,
  morale: 75,
  stamina: 80,
  supplies: 120,
  // daysElapsed: 0, // TODO: Will be tracked when camping feature is implemented
  progress: 0,
  route: ROUTE,
  journal: [],
  lastAction: null,
  status: "ongoing",
  inventory: [], // Special items found along the way
  crew: [], // Companions who join the journey
  knowledge: [], // Indigenous wisdom and clues learned
  mission: {
    objective: "Find Lágrimas da Lua (Tears of the Moon)",
    reason: "Save dying grandmother",
    cluesFound: 0,
    indigenousKnowledge: [],
  },
  // Hybrid Interaction System
  currentMode: "dialogue", // dialogue | action | exploration | encounter | reflection
  modeContext: {
    dialogue: {
      characterId: null,
      turnNumber: 0,
      canExit: true, // Can player leave this conversation?
      isConsequential: false, // Is this dialogue leading to game changes?
    },
    action: {
      availableCategories: ["movement", "social", "survival", "special"],
      lastCategory: null,
    },
    exploration: {
      areaId: null,
      itemsFound: [],
      turnsRemaining: 3,
    },
    encounter: {
      type: null, // danger | opportunity | mystery
      turnsRemaining: 0,
      resolved: false,
    },
    reflection: {
      type: null, // dream | journal | memory
      triggered: false,
    },
  },
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const applyActionDeltas = (state, deltas) => {
  const nextState = { ...state };
  nextState.stamina = clamp(nextState.stamina + (deltas.stamina ?? 0), 0, 100);
  nextState.morale = clamp(nextState.morale + (deltas.morale ?? 0), 0, 100);
  nextState.supplies = Math.max(0, nextState.supplies + (deltas.supplies ?? 0));
  nextState.progress = clamp(
    nextState.progress + (deltas.progress ?? 0),
    0,
    nextState.route.length - 1
  );
  return nextState;
};

const determineStatus = (state) => {
  if (state.supplies <= 0 || state.stamina <= 0 || state.morale <= 0) {
    return "failed";
  }
  if (state.progress >= state.route.length - 1) {
    return "arrived";
  }
  return "ongoing";
};

export const applyAction = (state, actionId) => {
  const candidates = getAvailableActions(state);
  const action = candidates.find((item) => item.id === actionId);
  if (!action) {
    throw new Error(`Unknown action id: ${actionId}`);
  }

  let nextState = applyActionDeltas(state, action.deltas ?? {});
  // nextState.daysElapsed += 1; // TODO: Will be tracked when camping feature is implemented
  nextState.lastAction = action;

  const encounter = randomEncounter(nextState);
  nextState = applyEncounter(nextState, encounter);
  nextState.status = determineStatus(nextState);

  return {
    state: nextState,
    encounter,
    action,
  };
};

export const getAvailableActions = (state) => {
  const actions = [...BASE_ACTIONS];
  if (state.supplies < 40) {
    actions.push({
      id: "ration",
      label: "Ration supplies",
      description: "Conserve rations to stretch supplies a little longer.",
      deltas: { supplies: +6, morale: -4, stamina: -2 },
    });
  }

  if (state.morale < 50) {
    actions.push({
      id: "story_circle",
      label: "Share stories",
      description: "Gather the crew to swap legends and bolster spirits.",
      deltas: { morale: +12, stamina: -2 },
    });
  }

  if (state.stamina < 40) {
    actions.push({
      id: "tonic",
      label: "Brew tonic",
      description: "Use herbs to craft a revitalizing tonic.",
      deltas: { stamina: +14, supplies: -5 },
    });
  }

  return actions;
};

export const summarizeState = (state) => {
  const location = state.route[state.progress] ?? state.route.at(-1);
  const summary = {
    playerName: state.playerName,
    location: location?.name ?? "Unknown",
    biome: location?.biome ?? "mystery",
    description: location?.description ?? "",
    morale: state.morale,
    stamina: state.stamina,
    supplies: state.supplies,
    daysElapsed: state.daysElapsed,
    status: state.status,
    lastAction: state.lastAction?.id ?? null,
  };
  return summary;
};
