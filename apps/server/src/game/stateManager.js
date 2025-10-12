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
    deltas: { progress: +1, stamina: -8, supplies: { food: -1, water: -1 } },
  },
  {
    id: "forage",
    label: "Forage along the banks",
    description: "Search for fruits, fish, and medicinal herbs.",
    deltas: {
      supplies: { food: +3, water: +2, medicine: +1 },
      stamina: -4,
      morale: +2,
    },
  },
  {
    id: "camp",
    label: "Set up camp early",
    description: "Rest, repair gear, and recover morale.",
    deltas: { stamina: +8, morale: +6, supplies: { food: -2, fuel: -1 } },
  },
  {
    id: "scout",
    label: "Scout ahead",
    description: "Explore upcoming bends for hazards and hidden routes.",
    deltas: { morale: +3, stamina: -3 },
  },
];

export const createInitialState = (
  playerName = "Explorer",
  sessionId = null
) => ({
  playerName,
  sessionId, // Session ID for tracking character relationships and conversation history
  morale: 75,
  stamina: 80,
  supplies: {
    food: 20, // 20 rations
    water: 30, // 30 canteens
    medicine: 3, // 3 doses
    fuel: 10, // 10 units
    tools: 5, // 5 items
  },
  survival: {
    lastFoodConsumption: Math.floor(Date.now() / 1000),
    lastWaterConsumption: Math.floor(Date.now() / 1000),
    starvationStage: 0,
    dehydrationStage: 0,
    survivalModifiers: {},
  },
  party: [], // Array of PartyMember objects
  economy: {
    currencyAmount: 1000, // Start with 1000 mil-réis
    barterGoods: {},
  },
  weather: {
    type: "normal",
    intensity: 1,
    temperature: 25.0,
    effects: {
      travelSpeed: 1.0,
      encounterRisk: 1.0,
      supplyConsumption: 1.0,
    },
  },
  minimap: {
    discoveredLocations: new Set(["loreto"]), // Start with current location
    currentLocation: "loreto",
  },
  camping: {
    lastCampTime: null,
    campLocation: null,
    campSafetyLevel: 50,
  },
  equipment: [], // Array of EquipmentItem objects
  travel: {
    currentLocation: "loreto",
    lastTravelTime: null,
    travelDistance: 0,
    travelModifiers: {},
    retreatCount: 0,
  },
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

// Survival mechanics
const calculateDehydrationStage = (timeSinceWater) => {
  const hours = timeSinceWater / 3600;
  if (hours >= 72) return 4; // Death
  if (hours >= 48) return 3; // Severe
  if (hours >= 24) return 2; // Moderate
  if (hours >= 12) return 1; // Mild
  return 0; // Normal
};

const calculateStarvationStage = (timeSinceFood) => {
  const days = timeSinceFood / (24 * 3600);
  if (days >= 21) return 4; // Death
  if (days >= 14) return 3; // Severe
  if (days >= 7) return 2; // Moderate
  if (days >= 3) return 1; // Mild
  return 0; // Normal
};

const updateSurvivalState = (state, currentTime) => {
  const timeSinceFood = currentTime - state.survival.lastFoodConsumption;
  const timeSinceWater = currentTime - state.survival.lastWaterConsumption;

  const dehydrationStage = calculateDehydrationStage(timeSinceWater);
  const starvationStage = calculateStarvationStage(timeSinceFood);

  return {
    ...state,
    survival: {
      ...state.survival,
      dehydrationStage,
      starvationStage,
      timeRemaining: {
        dehydration: Math.max(0, 72 * 3600 - timeSinceWater),
        starvation: Math.max(0, 21 * 24 * 3600 - timeSinceFood),
      },
    },
  };
};

const applySurvivalPenalties = (state) => {
  const penalties = {
    staminaRegeneration: 1.0,
    travelSpeed: 1.0,
    maxHealth: 1.0,
  };

  // Dehydration penalties
  switch (state.survival.dehydrationStage) {
    case 1:
      penalties.staminaRegeneration *= 0.9;
      penalties.travelSpeed *= 0.95;
      break;
    case 2:
      penalties.staminaRegeneration *= 0.75;
      penalties.travelSpeed *= 0.85;
      penalties.maxHealth *= 0.9;
      break;
    case 3:
      penalties.staminaRegeneration *= 0.5;
      penalties.travelSpeed *= 0.7;
      penalties.maxHealth *= 0.75;
      break;
    case 4:
      penalties.staminaRegeneration *= 0.25;
      penalties.travelSpeed *= 0.5;
      penalties.maxHealth *= 0.5;
      break;
  }

  // Starvation penalties (less severe initially)
  switch (state.survival.starvationStage) {
    case 1:
      penalties.staminaRegeneration *= 0.95;
      break;
    case 2:
      penalties.staminaRegeneration *= 0.85;
      penalties.travelSpeed *= 0.9;
      break;
    case 3:
      penalties.staminaRegeneration *= 0.6;
      penalties.travelSpeed *= 0.75;
      penalties.maxHealth *= 0.8;
      break;
    case 4:
      penalties.staminaRegeneration *= 0.3;
      penalties.travelSpeed *= 0.5;
      penalties.maxHealth *= 0.5;
      break;
  }

  return penalties;
};

// Party management functions
const recruitPartyMember = (state, characterData) => {
  const newMember = {
    characterId: characterData.id,
    name: characterData.name,
    role: characterData.role || "companion",
    skills: characterData.skills || [],
    stats: {
      morale: characterData.morale || 75,
      trustworthiness: characterData.trustworthiness || 50,
      charisma: characterData.charisma || 60,
      strength: characterData.strength || 70,
      knowledge: characterData.knowledge || 65,
      instincts: characterData.instincts || 55,
      playerLiking: characterData.playerLiking || 50,
    },
    reputationGroups: characterData.reputationGroups || {},
    recruitedAt: Math.floor(Date.now() / 1000),
    languages: characterData.languages || ["Portuguese"],
  };

  return {
    ...state,
    party: [...state.party, newMember],
  };
};

const dismissPartyMember = (state, characterId) => {
  return {
    ...state,
    party: state.party.filter((member) => member.characterId !== characterId),
  };
};

const updatePartyMemberStats = (state, characterId, statUpdates) => {
  return {
    ...state,
    party: state.party.map((member) =>
      member.characterId === characterId
        ? { ...member, stats: { ...member.stats, ...statUpdates } }
        : member
    ),
  };
};

const updatePartyMemberReputation = (state, characterId, group, delta) => {
  return {
    ...state,
    party: state.party.map((member) =>
      member.characterId === characterId
        ? {
            ...member,
            reputationGroups: {
              ...member.reputationGroups,
              [group]: Math.max(
                0,
                Math.min(100, (member.reputationGroups[group] || 50) + delta)
              ),
            },
          }
        : member
    ),
  };
};

// Economy management functions
const executeTrade = (state, tradeData) => {
  const { type, item, quantity, price } = tradeData;
  const newEconomy = { ...state.economy };

  if (type === "buy") {
    if (newEconomy.currencyAmount >= price * quantity) {
      newEconomy.currencyAmount -= price * quantity;
      // Add item to supplies or inventory
      if (["food", "water", "medicine", "fuel", "tools"].includes(item)) {
        state.supplies[item] += quantity;
      } else {
        // Special item
        if (!newEconomy.barterGoods[item]) {
          newEconomy.barterGoods[item] = 0;
        }
        newEconomy.barterGoods[item] += quantity;
      }
    } else {
      throw new Error("Insufficient funds");
    }
  } else if (type === "sell") {
    newEconomy.currencyAmount += price * quantity;
    // Remove item from supplies or inventory
    if (["food", "water", "medicine", "fuel", "tools"].includes(item)) {
      state.supplies[item] = Math.max(0, state.supplies[item] - quantity);
    } else {
      newEconomy.barterGoods[item] = Math.max(
        0,
        (newEconomy.barterGoods[item] || 0) - quantity
      );
    }
  }

  return {
    ...state,
    economy: newEconomy,
  };
};

const applyActionDeltas = (state, deltas) => {
  const nextState = { ...state };
  nextState.stamina = clamp(nextState.stamina + (deltas.stamina ?? 0), 0, 100);
  nextState.morale = clamp(nextState.morale + (deltas.morale ?? 0), 0, 100);

  // Handle new supply structure
  if (deltas.supplies) {
    nextState.supplies = { ...nextState.supplies };
    Object.keys(deltas.supplies).forEach((supplyType) => {
      nextState.supplies[supplyType] = Math.max(
        0,
        nextState.supplies[supplyType] + deltas.supplies[supplyType]
      );
    });
  }

  nextState.progress = clamp(
    nextState.progress + (deltas.progress ?? 0),
    0,
    nextState.route.length - 1
  );
  return nextState;
};

const determineStatus = (state) => {
  // Check if any critical supplies are depleted
  const criticalSuppliesDepleted =
    state.supplies.food <= 0 || state.supplies.water <= 0;

  if (criticalSuppliesDepleted || state.stamina <= 0 || state.morale <= 0) {
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

  // Update survival timers when consuming food/water
  const currentTime = Math.floor(Date.now() / 1000);
  if (action.deltas?.supplies?.food && action.deltas.supplies.food < 0) {
    nextState.survival.lastFoodConsumption = currentTime;
  }
  if (action.deltas?.supplies?.water && action.deltas.supplies.water < 0) {
    nextState.survival.lastWaterConsumption = currentTime;
  }

  // Update survival state
  nextState = updateSurvivalState(nextState, currentTime);

  // Apply survival penalties
  const penalties = applySurvivalPenalties(nextState);
  nextState.stamina = Math.max(
    0,
    nextState.stamina * penalties.staminaRegeneration
  );

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

  // Check if food or water is low
  if (state.supplies.food < 5 || state.supplies.water < 8) {
    actions.push({
      id: "ration",
      label: "Ration supplies",
      description: "Conserve rations to stretch supplies a little longer.",
      deltas: { supplies: { food: +2, water: +3 }, morale: -4, stamina: -2 },
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
      deltas: { stamina: +14, supplies: { medicine: -1 } },
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
    survival: state.survival,
    party: state.party,
    economy: state.economy,
    daysElapsed: state.daysElapsed,
    status: state.status,
    lastAction: state.lastAction?.id ?? null,
  };
  return summary;
};

// Export party management functions
export {
  recruitPartyMember,
  dismissPartyMember,
  updatePartyMemberStats,
  updatePartyMemberReputation,
};

// Export economy management functions
export { executeTrade };

// Weather management functions
const updateWeather = (state, weatherData) => {
  return {
    ...state,
    weather: {
      type: weatherData.type,
      intensity: weatherData.intensity,
      temperature: weatherData.temperature,
      effects: weatherData.effects,
    },
  };
};

const applyWeatherEffects = (state, action) => {
  const weatherEffects = state.weather.effects;
  const modifiedAction = { ...action };

  // Apply weather modifiers to action deltas
  if (modifiedAction.deltas) {
    if (modifiedAction.deltas.stamina) {
      modifiedAction.deltas.stamina *= weatherEffects.supplyConsumption;
    }
    if (modifiedAction.deltas.progress) {
      modifiedAction.deltas.progress *= weatherEffects.travelSpeed;
    }
    if (modifiedAction.deltas.supplies) {
      Object.keys(modifiedAction.deltas.supplies).forEach((supplyType) => {
        modifiedAction.deltas.supplies[supplyType] *=
          weatherEffects.supplyConsumption;
      });
    }
  }

  return modifiedAction;
};

// Minimap management functions
const discoverLocation = (state, locationId) => {
  const newMinimap = { ...state.minimap };
  newMinimap.discoveredLocations.add(locationId);
  return {
    ...state,
    minimap: newMinimap,
  };
};

const updateCurrentLocation = (state, locationId) => {
  return {
    ...state,
    minimap: {
      ...state.minimap,
      currentLocation: locationId,
    },
  };
};

// Camping management functions
const setupCamp = (state, locationId, safetyLevel = 50) => {
  const currentTime = Math.floor(Date.now() / 1000);
  return {
    ...state,
    camping: {
      lastCampTime: currentTime,
      campLocation: locationId,
      campSafetyLevel: safetyLevel,
    },
  };
};

const calculateCampSafety = (state, locationId) => {
  let safetyLevel = 50; // Base safety

  // Location-based safety modifiers
  const location = state.route.find((loc) => loc.id === locationId);
  if (location) {
    switch (location.biome) {
      case "riverside town":
        safetyLevel += 30;
        break;
      case "riverside settlement":
        safetyLevel += 20;
        break;
      case "protected wilderness":
        safetyLevel += 10;
        break;
      case "towering jungle":
        safetyLevel -= 10;
        break;
      case "lush wetlands":
        safetyLevel -= 20;
        break;
      default:
        safetyLevel += 0;
    }
  }

  // Party skill bonuses
  state.party.forEach((member) => {
    member.skills.forEach((skill) => {
      if (skill.type === "hunting") {
        safetyLevel += skill.level * 2;
      }
      if (skill.type === "naturalist") {
        safetyLevel += skill.level * 1;
      }
    });
  });

  // Weather penalties
  if (state.weather.type === "tropical_storm") {
    safetyLevel -= 30;
  } else if (state.weather.type === "monsoon") {
    safetyLevel -= 20;
  } else if (state.weather.type === "heavy_rain") {
    safetyLevel -= 10;
  }

  return Math.max(0, Math.min(100, safetyLevel));
};

const generateCampEvent = (state) => {
  const safetyLevel = state.camping.campSafetyLevel;
  const random = Math.random() * 100;

  // Event probability based on safety level
  if (random < 5) {
    // Negative event (5% chance)
    return {
      type: "negative",
      description: "Something dangerous approaches your camp...",
      effects: { morale: -10, stamina: -5 },
    };
  } else if (random < 30) {
    // Neutral event (25% chance)
    return {
      type: "neutral",
      description: "A quiet night passes uneventfully.",
      effects: {},
    };
  } else {
    // Positive event (70% chance)
    return {
      type: "positive",
      description: "You rest well and recover your strength.",
      effects: { morale: +5, stamina: +10 },
    };
  }
};

// Equipment management functions
const addEquipment = (state, equipmentItem) => {
  return {
    ...state,
    equipment: [...state.equipment, equipmentItem],
  };
};

const removeEquipment = (state, itemId) => {
  return {
    ...state,
    equipment: state.equipment.filter((item) => item.itemId !== itemId),
  };
};

const hasEquipment = (state, itemId) => {
  return state.equipment.some((item) => item.itemId === itemId);
};

const getEquipmentEffects = (state) => {
  const effects = {};
  state.equipment.forEach((item) => {
    Object.keys(item.effects).forEach((effectType) => {
      if (!effects[effectType]) {
        effects[effectType] = 1.0;
      }
      effects[effectType] *= item.effects[effectType];
    });
  });
  return effects;
};

// Travel management functions
const updateTravelState = (state, travelInfo) => {
  return {
    ...state,
    travel: {
      ...state.travel,
      currentLocation: travelInfo.destination,
      lastTravelTime: Math.floor(Date.now() / 1000),
      travelDistance: travelInfo.distance,
      travelModifiers: travelInfo.modifiers,
      retreatCount: travelInfo.isRetreat
        ? state.travel.retreatCount + 1
        : state.travel.retreatCount,
    },
  };
};

const calculateTravelTime = async (state, fromLocation, toLocation) => {
  const TravelManager = (await import("./travelManager.js")).default;
  const travelManager = new TravelManager();

  const modifiers = {
    weather: state.weather,
    partySkills: getPartySkillEffects(state.party),
    equipment: getEquipmentEffects(state),
  };

  return travelManager.calculateTravelTime(fromLocation, toLocation, modifiers);
};

const getPartySkillEffects = (party) => {
  const effects = {};
  party.forEach((member) => {
    member.skills.forEach((skill) => {
      if (!effects[skill.type]) {
        effects[skill.type] = 0;
      }
      effects[skill.type] += skill.level;
    });
  });
  return effects;
};

// Export weather and world management functions
export {
  updateWeather,
  applyWeatherEffects,
  discoverLocation,
  updateCurrentLocation,
  setupCamp,
  calculateCampSafety,
  generateCampEvent,
  addEquipment,
  removeEquipment,
  hasEquipment,
  getEquipmentEffects,
  updateTravelState,
  calculateTravelTime,
};
