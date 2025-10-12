/**
 * Encounter Manager
 *
 * Determines what happens when the player arrives at a new location.
 * Returns the appropriate mode transition and context for the encounter.
 */

/**
 * Determine what encounter occurs when arriving at a new location
 *
 * @param {Object} location - The location being arrived at
 * @param {Object} state - Current game state
 * @returns {Object} - { mode, context, reason }
 */
export function determineLocationEncounter(location, state) {
  // Factors that influence encounter type:
  // - Biome type (river vs flooded_forest vs village)
  // - Progress in journey (early vs late)
  // - Recent encounters (avoid repetition)
  // - Player stats (low stamina = more likely to rest)

  const roll = Math.random();
  const biome = location.biome;
  const progress = state.progress;
  const totalLocations = state.route.length;
  const journeyProgress = progress / totalLocations; // 0.0 to 1.0

  // Early game (first 20%): More NPC encounters to establish world
  if (journeyProgress < 0.2) {
    if (roll < 0.5) {
      return createNPCEncounter(location, state);
    } else if (roll < 0.8) {
      return createExplorationEncounter(location);
    } else {
      return createSafeArrival(location);
    }
  }

  // Mid game (20-80%): Balanced mix
  if (journeyProgress < 0.8) {
    if (roll < 0.25) {
      return createNPCEncounter(location, state);
    } else if (roll < 0.45) {
      return createWildlifeEncounter(location, state);
    } else if (roll < 0.7) {
      return createExplorationEncounter(location);
    } else if (roll < 0.85) {
      return createEnvironmentalEncounter(location, state);
    } else {
      return createSafeArrival(location);
    }
  }

  // Late game (80-100%): More intense encounters
  if (roll < 0.3) {
    return createNPCEncounter(location, state);
  } else if (roll < 0.6) {
    return createWildlifeEncounter(location, state);
  } else if (roll < 0.85) {
    return createEnvironmentalEncounter(location, state);
  } else {
    return createExplorationEncounter(location);
  }
}

/**
 * Create an NPC encounter - transitions to dialogue mode
 */
function createNPCEncounter(location, state) {
  return {
    mode: "dialogue",
    context: {
      encounterType: "npc",
      locationId: location.id,
      reason: "arrival_encounter",
    },
    reason: "npc_encounter",
    message: `As you arrive at ${location.name}, you notice someone nearby...`,
  };
}

/**
 * Create a wildlife encounter - transitions to encounter mode
 */
function createWildlifeEncounter(location, state) {
  // Select appropriate wildlife based on biome
  const wildlifeByBiome = {
    river: ["Caiman", "Pink River Dolphin", "Piranha School"],
    flooded_forest: ["Jaguar", "Anaconda", "Poison Dart Frog"],
    village: ["Domestic Animals", "Guard Dogs"],
    rapids: ["River Current", "Whirlpool"],
    tributary: ["Caiman", "River Otter"],
  };

  const possibleWildlife =
    wildlifeByBiome[location.biome] || wildlifeByBiome.river;
  const wildlife =
    possibleWildlife[Math.floor(Math.random() * possibleWildlife.length)];

  return {
    mode: "encounter",
    context: {
      encounterType: "wildlife",
      wildlife: wildlife,
      locationId: location.id,
      dangerLevel: calculateDangerLevel(wildlife, state),
    },
    reason: "wildlife_encounter",
    message: `A ${wildlife} appears as you arrive at ${location.name}!`,
  };
}

/**
 * Create an environmental hazard encounter
 */
function createEnvironmentalEncounter(location, state) {
  const hazards = [
    { type: "storm", name: "Sudden Storm", danger: "high" },
    { type: "current", name: "Strong Current", danger: "medium" },
    { type: "debris", name: "River Debris", danger: "low" },
    { type: "rapids", name: "Unexpected Rapids", danger: "high" },
  ];

  const hazard = hazards[Math.floor(Math.random() * hazards.length)];

  return {
    mode: "encounter",
    context: {
      encounterType: "environmental",
      hazard: hazard.name,
      hazardType: hazard.type,
      dangerLevel: hazard.danger,
      locationId: location.id,
    },
    reason: "environmental_hazard",
    message: `As you arrive at ${location.name}, you encounter a ${hazard.name}!`,
  };
}

/**
 * Create an exploration opportunity - transitions to exploration mode
 */
function createExplorationEncounter(location) {
  const discoveries = [
    "hidden cove",
    "abandoned camp",
    "interesting vegetation",
    "unusual rock formation",
    "bird nesting area",
    "fish spawning ground",
  ];

  const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];

  return {
    mode: "exploration",
    context: {
      encounterType: "discovery",
      discovery: discovery,
      locationId: location.id,
    },
    reason: "point_of_interest",
    message: `Arriving at ${location.name}, you notice a ${discovery} worth investigating.`,
  };
}

/**
 * Safe arrival - no immediate encounter, stay in action mode
 */
function createSafeArrival(location) {
  return {
    mode: "action",
    context: {
      encounterType: "safe",
      locationId: location.id,
    },
    reason: "safe_arrival",
    message: `You arrive safely at ${location.name}. The ${location.biome} stretches before you.`,
  };
}

/**
 * Calculate danger level based on wildlife and player state
 */
function calculateDangerLevel(wildlife, state) {
  const dangerousAnimals = ["Jaguar", "Anaconda", "Caiman", "Piranha School"];

  if (dangerousAnimals.includes(wildlife)) {
    // More dangerous if player is weak
    if (state.stamina < 30 || state.morale < 30) {
      return "high";
    }
    return "medium";
  }

  return "low";
}

export default {
  determineLocationEncounter,
};
