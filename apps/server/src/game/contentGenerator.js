/**
 * Procedural Content Generation System for Igapó
 * Handles infinite replayability through dynamic content generation
 */

import { random, SeededRandom } from "../utils/random.js";

class ContentGenerator {
  constructor() {
    this.templates = {
      characters: this.loadCharacterTemplates(),
      locations: this.loadLocationTemplates(),
      animals: this.loadAnimalTemplates(),
      items: this.loadItemTemplates(),
    };

    this.seed = null;
    this.rng = random || (() => Math.random()); // Use imported random or fallback
  }

  /**
   * Set seed for reproducible generation
   */
  setSeed(seed) {
    this.seed = seed;
    this.rng = new SeededRandom(seed);
  }

  /**
   * Generate a unique character based on location and context
   */
  generateCharacter(locationType, biome, difficulty = 1, culturalContext = {}) {
    const characterTemplates =
      this.templates.characters[locationType] ||
      this.templates.characters.default;
    const template = this.selectWeightedTemplate(
      characterTemplates,
      difficulty
    );

    if (!template) {
      return this.generateFallbackCharacter(locationType, biome);
    }

    return this.customizeCharacter(template, biome, culturalContext);
  }

  /**
   * Generate a unique location based on biome and position
   */
  generateLocation(biome, position, connections = [], worldState = {}) {
    const locationTemplates =
      this.templates.locations[biome] || this.templates.locations.default;
    const template = this.selectWeightedTemplate(
      locationTemplates,
      position.difficulty || 1
    );

    if (!template) {
      return this.generateFallbackLocation(biome, position);
    }

    return this.customizeLocation(
      template,
      biome,
      position,
      connections,
      worldState
    );
  }

  /**
   * Generate an animal encounter based on biome and time
   */
  generateAnimalEncounter(biome, timeOfDay, weather, playerLevel = 1) {
    const animalTemplates =
      this.templates.animals[biome] || this.templates.animals.default;
    const template = this.selectWeightedTemplate(animalTemplates, playerLevel);

    if (!template) {
      return null; // No encounter
    }

    return this.customizeAnimalEncounter(template, biome, timeOfDay, weather);
  }

  /**
   * Generate a unique item based on location and rarity
   */
  generateItem(locationType, rarity = "common", culturalContext = {}) {
    const itemTemplates =
      this.templates.items[locationType] || this.templates.items.default;
    const template = this.selectWeightedTemplate(itemTemplates, rarity);

    if (!template) {
      return null; // No item
    }

    return this.customizeItem(template, rarity, culturalContext);
  }

  /**
   * Select template based on weighted probability
   */
  selectWeightedTemplate(templates, weightFactor = 1) {
    if (!templates || templates.length === 0) return null;

    const weightedTemplates = templates.map((template) => ({
      ...template,
      weight: this.calculateWeight(template, weightFactor),
    }));

    const totalWeight = weightedTemplates.reduce((sum, t) => sum + t.weight, 0);
    if (totalWeight === 0) return templates[0];

    const randomValue = this.rng() * totalWeight;
    let currentWeight = 0;

    for (const template of weightedTemplates) {
      currentWeight += template.weight;
      if (randomValue <= currentWeight) {
        return template;
      }
    }

    return weightedTemplates[weightedTemplates.length - 1];
  }

  /**
   * Calculate weight for template selection
   */
  calculateWeight(template, weightFactor) {
    let weight = template.baseWeight || 1;

    // Adjust based on rarity
    if (template.rarity) {
      const rarityMultipliers = {
        common: 1.0,
        uncommon: 0.5,
        rare: 0.2,
        legendary: 0.05,
      };
      weight *= rarityMultipliers[template.rarity] || 1.0;
    }

    // Adjust based on difficulty
    if (template.difficulty) {
      const difficultyDiff = Math.abs(template.difficulty - weightFactor);
      weight *= Math.max(0.1, 1 - difficultyDiff * 0.2);
    }

    return weight;
  }

  /**
   * Customize character based on biome and cultural context
   */
  customizeCharacter(template, biome, culturalContext) {
    const character = { ...template };

    // Apply biome-specific modifications
    character.biomeModifiers = this.getBiomeModifiers(biome);

    // Apply cultural context
    if (culturalContext.language) {
      character.languages = this.generateLanguages(culturalContext.language);
    }

    if (culturalContext.religion) {
      character.beliefs = this.generateBeliefs(culturalContext.religion);
    }

    // Randomize stats within template ranges
    character.stats = this.randomizeStats(template.stats);

    // Generate unique personality traits
    character.personality = this.generatePersonality(template.personalityBase);

    // Generate appearance details
    character.appearance = this.generateAppearance(
      template.appearanceBase,
      biome
    );

    // Generate background story
    character.background = this.generateBackground(
      template.backgroundBase,
      biome
    );

    return character;
  }

  /**
   * Customize location based on biome and position
   */
  customizeLocation(template, biome, position, connections, worldState) {
    const location = { ...template };

    // Apply biome-specific characteristics
    location.biomeModifiers = this.getBiomeModifiers(biome);

    // Generate unique features based on position
    location.features = this.generateLocationFeatures(
      template.features,
      biome,
      position
    );

    // Generate connections to other locations
    location.connections = this.generateConnections(connections, biome);

    // Apply world state effects
    location.worldStateEffects = this.applyWorldStateEffects(worldState, biome);

    // Generate unique description
    location.description = this.generateLocationDescription(
      template.descriptionBase,
      biome,
      location.features
    );

    // Generate available resources
    location.resources = this.generateResources(template.resources, biome);

    // Generate potential encounters
    location.encounters = this.generateLocationEncounters(
      template.encounters,
      biome
    );

    return location;
  }

  /**
   * Customize animal encounter based on context
   */
  customizeAnimalEncounter(template, biome, timeOfDay, weather) {
    const encounter = { ...template };

    // Apply time-of-day modifications
    encounter.timeModifiers = this.getTimeModifiers(timeOfDay);

    // Apply weather effects
    encounter.weatherEffects = this.getWeatherEffects(weather);

    // Generate behavior based on context
    encounter.behavior = this.generateAnimalBehavior(
      template.behaviorBase,
      timeOfDay,
      weather
    );

    // Generate interaction options
    encounter.interactions = this.generateAnimalInteractions(
      template.interactions,
      biome
    );

    // Generate rewards/penalties
    encounter.rewards = this.generateAnimalRewards(template.rewards, biome);

    return encounter;
  }

  /**
   * Customize item based on rarity and cultural context
   */
  customizeItem(template, rarity, culturalContext) {
    const item = { ...template };

    // Apply rarity modifications
    item.rarityModifiers = this.getRarityModifiers(rarity);

    // Apply cultural significance
    if (culturalContext.culture) {
      item.culturalSignificance = this.generateCulturalSignificance(
        culturalContext.culture
      );
    }

    // Generate unique properties
    item.properties = this.generateItemProperties(template.properties, rarity);

    // Generate unique description
    item.description = this.generateItemDescription(
      template.descriptionBase,
      rarity,
      item.properties
    );

    // Generate value based on rarity and properties
    item.value = this.calculateItemValue(
      template.baseValue,
      rarity,
      item.properties
    );

    return item;
  }

  /**
   * Load character templates from database or files
   */
  loadCharacterTemplates() {
    return {
      "riverside town": [
        {
          id: "merchant_001",
          name: "River Trader",
          type: "merchant",
          rarity: "common",
          baseWeight: 10,
          difficulty: 1,
          stats: {
            charisma: { min: 6, max: 9 },
            knowledge: { min: 4, max: 7 },
            instincts: { min: 5, max: 8 },
          },
          personalityBase: ["pragmatic", "opportunistic"],
          appearanceBase: ["weathered", "well-dressed"],
          backgroundBase: "river trader",
          skills: ["navigation", "trading"],
          languages: ["portuguese", "spanish"],
          beliefs: ["capitalism", "survival"],
        },
      ],
      "protected wilderness": [
        {
          id: "guide_001",
          name: "Indigenous Guide",
          type: "guide",
          rarity: "uncommon",
          baseWeight: 5,
          difficulty: 2,
          stats: {
            navigation: { min: 8, max: 10 },
            instincts: { min: 7, max: 10 },
            knowledge: { min: 6, max: 9 },
          },
          personalityBase: ["wise", "protective"],
          appearanceBase: ["traditional", "confident"],
          backgroundBase: "tribal guide",
          skills: ["navigation", "naturalist", "survival"],
          languages: ["indigenous", "portuguese"],
          beliefs: ["animism", "harmony"],
        },
      ],
      default: [
        {
          id: "traveler_001",
          name: "Fellow Traveler",
          type: "traveler",
          rarity: "common",
          baseWeight: 8,
          difficulty: 1,
          stats: {
            charisma: { min: 4, max: 7 },
            instincts: { min: 5, max: 8 },
            knowledge: { min: 3, max: 6 },
          },
          personalityBase: ["curious", "friendly"],
          appearanceBase: ["travel-worn", "determined"],
          backgroundBase: "adventurer",
          skills: ["survival"],
          languages: ["portuguese"],
          beliefs: ["exploration", "freedom"],
        },
      ],
    };
  }

  /**
   * Load location templates from database or files
   */
  loadLocationTemplates() {
    return {
      "riverside town": [
        {
          id: "town_001",
          name: "River Settlement",
          type: "settlement",
          rarity: "common",
          baseWeight: 10,
          difficulty: 1,
          features: ["market", "dock", "inn"],
          resources: ["food", "water", "supplies"],
          encounters: ["merchants", "travelers", "officials"],
          descriptionBase: "A bustling riverside community",
          connections: ["river", "road", "trail"],
        },
      ],
      "protected wilderness": [
        {
          id: "wilderness_001",
          name: "Sacred Grove",
          type: "wilderness",
          rarity: "uncommon",
          baseWeight: 5,
          difficulty: 2,
          features: ["ancient trees", "spiritual sites", "wildlife"],
          resources: ["medicinal plants", "fresh water", "shelter"],
          encounters: ["wildlife", "spirits", "guardians"],
          descriptionBase: "A pristine wilderness area",
          connections: ["trail", "river", "hidden path"],
        },
      ],
      default: [
        {
          id: "generic_001",
          name: "Unknown Location",
          type: "generic",
          rarity: "common",
          baseWeight: 8,
          difficulty: 1,
          features: ["basic shelter", "water source"],
          resources: ["water", "basic supplies"],
          encounters: ["wildlife", "travelers"],
          descriptionBase: "A remote location",
          connections: ["trail", "river"],
        },
      ],
    };
  }

  /**
   * Load animal templates from database or files
   */
  loadAnimalTemplates() {
    return {
      "riverside town": [
        {
          id: "bird_001",
          name: "River Kingfisher",
          type: "bird",
          rarity: "common",
          baseWeight: 10,
          difficulty: 1,
          behaviorBase: ["hunting", "perching", "flying"],
          interactions: ["observe", "photograph", "feed"],
          rewards: ["feathers", "knowledge"],
          descriptionBase: "A colorful bird hunting fish",
        },
      ],
      "protected wilderness": [
        {
          id: "mammal_001",
          name: "Jaguar",
          type: "predator",
          rarity: "rare",
          baseWeight: 2,
          difficulty: 4,
          behaviorBase: ["hunting", "territorial", "stealth"],
          interactions: ["avoid", "observe", "confront"],
          rewards: ["fur", "claws", "respect"],
          descriptionBase: "A powerful jungle predator",
        },
      ],
      default: [
        {
          id: "generic_001",
          name: "Wildlife",
          type: "generic",
          rarity: "common",
          baseWeight: 8,
          difficulty: 1,
          behaviorBase: ["foraging", "alert", "fleeing"],
          interactions: ["observe", "approach", "avoid"],
          rewards: ["knowledge", "materials"],
          descriptionBase: "Local wildlife",
        },
      ],
    };
  }

  /**
   * Load item templates from database or files
   */
  loadItemTemplates() {
    return {
      "riverside town": [
        {
          id: "tool_001",
          name: "River Compass",
          type: "tool",
          rarity: "common",
          baseWeight: 10,
          baseValue: 50,
          properties: ["navigation", "durability"],
          descriptionBase: "A reliable navigation tool",
          culturalSignificance: "essential for river travel",
        },
      ],
      "protected wilderness": [
        {
          id: "artifact_001",
          name: "Sacred Stone",
          type: "artifact",
          rarity: "rare",
          baseWeight: 3,
          baseValue: 200,
          properties: ["spiritual", "protective"],
          descriptionBase: "A stone with spiritual significance",
          culturalSignificance: "sacred to local tribes",
        },
      ],
      default: [
        {
          id: "generic_001",
          name: "Found Item",
          type: "generic",
          rarity: "common",
          baseWeight: 8,
          baseValue: 25,
          properties: ["useful", "basic"],
          descriptionBase: "A useful item",
          culturalSignificance: "common in the region",
        },
      ],
    };
  }

  /**
   * Generate fallback character when no template matches
   */
  generateFallbackCharacter(locationType, biome) {
    return {
      id: `fallback_${Date.now()}`,
      name: "Local Resident",
      type: "generic",
      rarity: "common",
      stats: {
        charisma: 5,
        knowledge: 5,
        instincts: 5,
      },
      personality: ["neutral", "helpful"],
      appearance: ["local", "practical"],
      background: "local resident",
      skills: ["survival"],
      languages: ["portuguese"],
      beliefs: ["community", "survival"],
    };
  }

  /**
   * Generate fallback location when no template matches
   */
  generateFallbackLocation(biome, position) {
    return {
      id: `fallback_${Date.now()}`,
      name: "Unknown Place",
      type: "generic",
      rarity: "common",
      features: ["basic", "remote"],
      resources: ["water", "shelter"],
      encounters: ["wildlife"],
      description: "A remote location in the wilderness",
      connections: ["trail"],
      biomeModifiers: this.getBiomeModifiers(biome),
    };
  }

  /**
   * Helper methods for customization
   */
  getBiomeModifiers(biome) {
    const modifiers = {
      "riverside town": { civilization: 1.0, danger: 0.3, resources: 1.2 },
      "protected wilderness": {
        civilization: 0.1,
        danger: 0.7,
        resources: 0.8,
      },
      "towering jungle": { civilization: 0.0, danger: 0.9, resources: 0.6 },
      "whitewater passage": { civilization: 0.2, danger: 0.8, resources: 0.4 },
      "lush wetlands": { civilization: 0.1, danger: 0.6, resources: 1.0 },
      "blackwater lagoon": { civilization: 0.0, danger: 0.5, resources: 0.7 },
      "riverside settlement": {
        civilization: 0.8,
        danger: 0.4,
        resources: 1.1,
      },
      "parrot gathering site": {
        civilization: 0.0,
        danger: 0.3,
        resources: 0.9,
      },
      "natural phenomenon": { civilization: 0.0, danger: 0.2, resources: 0.5 },
      "white sand beaches": { civilization: 0.1, danger: 0.2, resources: 0.8 },
      "tidal delta": { civilization: 0.0, danger: 0.4, resources: 0.6 },
    };
    return modifiers[biome] || modifiers["riverside town"];
  }

  getTimeModifiers(timeOfDay) {
    const modifiers = {
      dawn: { activity: 0.7, danger: 0.6, visibility: 0.8 },
      morning: { activity: 1.0, danger: 0.4, visibility: 1.0 },
      midday: { activity: 0.8, danger: 0.3, visibility: 1.0 },
      afternoon: { activity: 0.9, danger: 0.5, visibility: 0.9 },
      evening: { activity: 0.6, danger: 0.7, visibility: 0.7 },
      night: { activity: 0.3, danger: 0.9, visibility: 0.3 },
    };
    return modifiers[timeOfDay] || modifiers.morning;
  }

  getWeatherEffects(weather) {
    const effects = {
      normal: { visibility: 1.0, danger: 1.0, activity: 1.0 },
      light_rain: { visibility: 0.9, danger: 1.1, activity: 0.9 },
      medium_rain: { visibility: 0.7, danger: 1.2, activity: 0.8 },
      heavy_rain: { visibility: 0.5, danger: 1.4, activity: 0.6 },
      monsoon: { visibility: 0.3, danger: 1.6, activity: 0.4 },
      tropical_storm: { visibility: 0.2, danger: 2.0, activity: 0.2 },
      heatwave: { visibility: 1.0, danger: 1.3, activity: 0.7 },
    };
    return effects[weather.type] || effects.normal;
  }

  getRarityModifiers(rarity) {
    const modifiers = {
      common: { value: 1.0, availability: 1.0, effects: 1.0 },
      uncommon: { value: 1.5, availability: 0.5, effects: 1.2 },
      rare: { value: 2.5, availability: 0.2, effects: 1.5 },
      legendary: { value: 5.0, availability: 0.05, effects: 2.0 },
    };
    return modifiers[rarity] || modifiers.common;
  }

  /**
   * Generate randomized values within ranges
   */
  randomizeStats(stats) {
    const randomized = {};
    for (const [key, range] of Object.entries(stats)) {
      if (
        typeof range === "object" &&
        range.min !== undefined &&
        range.max !== undefined
      ) {
        randomized[key] =
          Math.floor(this.rng() * (range.max - range.min + 1)) + range.min;
      } else {
        randomized[key] = range;
      }
    }
    return randomized;
  }

  /**
   * Generate unique content based on templates
   */
  generateLanguages(baseLanguage) {
    const languageOptions = [
      "portuguese",
      "spanish",
      "indigenous",
      "english",
      "french",
    ];
    const languages = [baseLanguage];

    // Add 1-2 additional languages based on RNG
    const additionalCount = Math.floor(this.rng() * 2) + 1;
    const availableLanguages = languageOptions.filter(
      (lang) => lang !== baseLanguage
    );

    for (let i = 0; i < additionalCount && availableLanguages.length > 0; i++) {
      const randomIndex = Math.floor(this.rng() * availableLanguages.length);
      languages.push(availableLanguages.splice(randomIndex, 1)[0]);
    }

    return languages;
  }

  generateBeliefs(baseBelief) {
    const beliefOptions = [
      "animism",
      "christianity",
      "capitalism",
      "survival",
      "harmony",
      "exploration",
    ];
    const beliefs = [baseBelief];

    // Add 1 additional belief based on RNG
    const availableBeliefs = beliefOptions.filter(
      (belief) => belief !== baseBelief
    );
    if (availableBeliefs.length > 0) {
      const randomIndex = Math.floor(this.rng() * availableBeliefs.length);
      beliefs.push(availableBeliefs[randomIndex]);
    }

    return beliefs;
  }

  generatePersonality(basePersonality) {
    const personalityOptions = [
      "curious",
      "cautious",
      "brave",
      "wise",
      "pragmatic",
      "spiritual",
      "friendly",
      "guarded",
    ];
    const personality = [...basePersonality];

    // Add 1-2 additional traits based on RNG
    const additionalCount = Math.floor(this.rng() * 2) + 1;
    const availableTraits = personalityOptions.filter(
      (trait) => !personality.includes(trait)
    );

    for (let i = 0; i < additionalCount && availableTraits.length > 0; i++) {
      const randomIndex = Math.floor(this.rng() * availableTraits.length);
      personality.push(availableTraits.splice(randomIndex, 1)[0]);
    }

    return personality;
  }

  generateAppearance(baseAppearance, biome) {
    const appearanceOptions = [
      "weathered",
      "traditional",
      "modern",
      "practical",
      "ornate",
      "simple",
      "colorful",
      "muted",
    ];
    const appearance = [...baseAppearance];

    // Add biome-specific appearance traits
    const biomeTraits = {
      "riverside town": ["clean", "well-dressed"],
      "protected wilderness": ["natural", "earthy"],
      "towering jungle": ["rugged", "camouflaged"],
      "whitewater passage": ["wet", "determined"],
      "lush wetlands": ["muddy", "resilient"],
      "blackwater lagoon": ["mysterious", "dark"],
      "riverside settlement": ["practical", "community-focused"],
      "parrot gathering site": ["colorful", "wild"],
      "natural phenomenon": ["awe-inspired", "humble"],
      "white sand beaches": ["sun-kissed", "relaxed"],
      "tidal delta": ["salt-weathered", "enduring"],
    };

    const biomeSpecificTraits = biomeTraits[biome] || ["practical"];
    appearance.push(...biomeSpecificTraits);

    return appearance;
  }

  generateBackground(baseBackground, biome) {
    const backgroundOptions = [
      "river trader",
      "tribal guide",
      "adventurer",
      "local resident",
      "explorer",
      "merchant",
      "healer",
      "hunter",
    ];
    const background = baseBackground;

    // Add biome-specific background details
    const biomeDetails = {
      "riverside town": "born and raised by the river",
      "protected wilderness": "guardian of the wild places",
      "towering jungle": "navigator of the deep forest",
      "whitewater passage": "master of the rapids",
      "lush wetlands": "keeper of the wetlands",
      "blackwater lagoon": "protector of the dark waters",
      "riverside settlement": "pillar of the community",
      "parrot gathering site": "observer of the birds",
      "natural phenomenon": "witness to nature's power",
      "white sand beaches": "guardian of the shores",
      "tidal delta": "navigator of the changing waters",
    };

    const biomeDetail = biomeDetails[biome] || "familiar with the local area";

    return `${background}, ${biomeDetail}`;
  }

  generateLocationFeatures(baseFeatures, biome, position) {
    const featureOptions = [
      "market",
      "dock",
      "inn",
      "temple",
      "wildlife",
      "waterfall",
      "cave",
      "clearing",
      "ruins",
      "garden",
    ];
    const features = [...baseFeatures];

    // Add biome-specific features
    const biomeFeatures = {
      "riverside town": ["market", "dock", "inn"],
      "protected wilderness": ["wildlife", "temple", "clearing"],
      "towering jungle": ["waterfall", "cave", "wildlife"],
      "whitewater passage": ["rapids", "rocks", "clearing"],
      "lush wetlands": ["marsh", "wildlife", "clearing"],
      "blackwater lagoon": ["lagoon", "wildlife", "clearing"],
      "riverside settlement": ["dock", "inn", "market"],
      "parrot gathering site": ["clay lick", "wildlife", "clearing"],
      "natural phenomenon": ["unique feature", "wildlife", "clearing"],
      "white sand beaches": ["beach", "wildlife", "clearing"],
      "tidal delta": ["delta", "wildlife", "clearing"],
    };

    const biomeSpecificFeatures = biomeFeatures[biome] || [
      "clearing",
      "wildlife",
    ];
    features.push(...biomeSpecificFeatures);

    // Add position-specific features
    if (position.difficulty > 2) {
      features.push("challenging terrain");
    }

    return features;
  }

  generateConnections(connections, biome) {
    const connectionOptions = [
      "river",
      "road",
      "trail",
      "hidden path",
      "waterway",
      "bridge",
      "ford",
    ];
    const generatedConnections = [...connections];

    // Add biome-specific connections
    const biomeConnections = {
      "riverside town": ["river", "road", "bridge"],
      "protected wilderness": ["trail", "hidden path", "river"],
      "towering jungle": ["trail", "hidden path", "waterway"],
      "whitewater passage": ["river", "trail", "ford"],
      "lush wetlands": ["waterway", "trail", "ford"],
      "blackwater lagoon": ["waterway", "trail", "hidden path"],
      "riverside settlement": ["river", "road", "bridge"],
      "parrot gathering site": ["trail", "hidden path", "waterway"],
      "natural phenomenon": ["trail", "hidden path", "waterway"],
      "white sand beaches": ["trail", "waterway", "ford"],
      "tidal delta": ["waterway", "trail", "ford"],
    };

    const biomeSpecificConnections = biomeConnections[biome] || [
      "trail",
      "river",
    ];
    generatedConnections.push(...biomeSpecificConnections);

    return generatedConnections;
  }

  applyWorldStateEffects(worldState, biome) {
    const effects = {};

    // Apply weather effects
    if (worldState.weather) {
      effects.weather = this.getWeatherEffects(worldState.weather);
    }

    // Apply time effects
    if (worldState.timeOfDay) {
      effects.time = this.getTimeModifiers(worldState.timeOfDay);
    }

    // Apply player reputation effects
    if (worldState.playerReputation) {
      effects.reputation = {
        trust: worldState.playerReputation.trust || 0,
        fear: worldState.playerReputation.fear || 0,
        respect: worldState.playerReputation.respect || 0,
      };
    }

    return effects;
  }

  generateLocationDescription(baseDescription, biome, features) {
    const biomeDescriptions = {
      "riverside town":
        "A bustling community where the river meets civilization",
      "protected wilderness": "A pristine area where nature reigns supreme",
      "towering jungle": "A dense forest where ancient trees reach for the sky",
      "whitewater passage": "A challenging stretch of rapids and rocks",
      "lush wetlands": "A waterlogged paradise teeming with life",
      "blackwater lagoon": "A mysterious dark water surrounded by mystery",
      "riverside settlement": "A small community built by the river's edge",
      "parrot gathering site": "A place where colorful birds gather in numbers",
      "natural phenomenon": "A unique natural feature that defies explanation",
      "white sand beaches": "Pristine beaches hidden in the rainforest",
      "tidal delta": "Where the river meets the sea in a dance of currents",
    };

    const biomeDescription = biomeDescriptions[biome] || baseDescription;
    const featureDescription = features.join(", ");

    return `${biomeDescription}. This area features ${featureDescription}.`;
  }

  generateResources(baseResources, biome) {
    const resourceOptions = [
      "food",
      "water",
      "supplies",
      "medicine",
      "fuel",
      "tools",
      "materials",
      "shelter",
    ];
    const resources = [...baseResources];

    // Add biome-specific resources
    const biomeResources = {
      "riverside town": ["food", "water", "supplies", "tools"],
      "protected wilderness": ["medicine", "materials", "shelter"],
      "towering jungle": ["materials", "shelter", "medicine"],
      "whitewater passage": ["water", "materials"],
      "lush wetlands": ["water", "medicine", "materials"],
      "blackwater lagoon": ["water", "materials"],
      "riverside settlement": ["food", "water", "supplies"],
      "parrot gathering site": ["materials", "shelter"],
      "natural phenomenon": ["materials", "shelter"],
      "white sand beaches": ["water", "shelter"],
      "tidal delta": ["water", "materials"],
    };

    const biomeSpecificResources = biomeResources[biome] || [
      "water",
      "shelter",
    ];
    resources.push(...biomeSpecificResources);

    return resources;
  }

  generateLocationEncounters(baseEncounters, biome) {
    const encounterOptions = [
      "merchants",
      "travelers",
      "wildlife",
      "spirits",
      "guardians",
      "officials",
      "hunters",
      "healers",
    ];
    const encounters = [...baseEncounters];

    // Add biome-specific encounters
    const biomeEncounters = {
      "riverside town": ["merchants", "travelers", "officials"],
      "protected wilderness": ["wildlife", "spirits", "guardians"],
      "towering jungle": ["wildlife", "hunters", "spirits"],
      "whitewater passage": ["wildlife", "travelers"],
      "lush wetlands": ["wildlife", "hunters"],
      "blackwater lagoon": ["wildlife", "spirits"],
      "riverside settlement": ["merchants", "travelers"],
      "parrot gathering site": ["wildlife", "hunters"],
      "natural phenomenon": ["spirits", "guardians"],
      "white sand beaches": ["wildlife", "travelers"],
      "tidal delta": ["wildlife", "hunters"],
    };

    const biomeSpecificEncounters = biomeEncounters[biome] || [
      "wildlife",
      "travelers",
    ];
    encounters.push(...biomeSpecificEncounters);

    return encounters;
  }

  generateAnimalBehavior(baseBehavior, timeOfDay, weather) {
    const behaviorOptions = [
      "hunting",
      "foraging",
      "resting",
      "alert",
      "territorial",
      "migrating",
      "breeding",
      "socializing",
    ];
    const behavior = [...baseBehavior];

    // Add time-of-day specific behavior
    const timeBehaviors = {
      dawn: ["alert", "foraging"],
      morning: ["active", "foraging"],
      midday: ["resting", "alert"],
      afternoon: ["active", "hunting"],
      evening: ["hunting", "socializing"],
      night: ["hunting", "territorial"],
    };

    const timeSpecificBehavior = timeBehaviors[timeOfDay] || [
      "active",
      "alert",
    ];
    behavior.push(...timeSpecificBehavior);

    // Add weather-specific behavior
    if (weather.type === "rain") {
      behavior.push("seeking shelter");
    } else if (weather.type === "heatwave") {
      behavior.push("seeking shade");
    }

    return behavior;
  }

  generateAnimalInteractions(baseInteractions, biome) {
    const interactionOptions = [
      "observe",
      "approach",
      "avoid",
      "feed",
      "photograph",
      "hunt",
      "confront",
      "befriend",
    ];
    const interactions = [...baseInteractions];

    // Add biome-specific interactions
    const biomeInteractions = {
      "riverside town": ["observe", "feed", "photograph"],
      "protected wilderness": ["observe", "avoid", "respect"],
      "towering jungle": ["observe", "avoid", "hunt"],
      "whitewater passage": ["observe", "avoid"],
      "lush wetlands": ["observe", "approach", "avoid"],
      "blackwater lagoon": ["observe", "avoid"],
      "riverside settlement": ["observe", "feed"],
      "parrot gathering site": ["observe", "photograph"],
      "natural phenomenon": ["observe", "respect"],
      "white sand beaches": ["observe", "approach"],
      "tidal delta": ["observe", "avoid"],
    };

    const biomeSpecificInteractions = biomeInteractions[biome] || [
      "observe",
      "avoid",
    ];
    interactions.push(...biomeSpecificInteractions);

    return interactions;
  }

  generateAnimalRewards(baseRewards, biome) {
    const rewardOptions = [
      "knowledge",
      "materials",
      "respect",
      "fur",
      "claws",
      "feathers",
      "meat",
      "bones",
    ];
    const rewards = [...baseRewards];

    // Add biome-specific rewards
    const biomeRewards = {
      "riverside town": ["knowledge", "materials"],
      "protected wilderness": ["respect", "knowledge"],
      "towering jungle": ["materials", "respect"],
      "whitewater passage": ["materials"],
      "lush wetlands": ["materials", "knowledge"],
      "blackwater lagoon": ["materials"],
      "riverside settlement": ["knowledge"],
      "parrot gathering site": ["feathers", "knowledge"],
      "natural phenomenon": ["respect", "knowledge"],
      "white sand beaches": ["materials"],
      "tidal delta": ["materials"],
    };

    const biomeSpecificRewards = biomeRewards[biome] || ["knowledge"];
    rewards.push(...biomeSpecificRewards);

    return rewards;
  }

  generateCulturalSignificance(culture) {
    const significanceOptions = [
      "sacred to local tribes",
      "important for river navigation",
      "valued by traders",
      "respected by all",
      "feared by many",
      "cherished by locals",
      "essential for survival",
      "symbol of status",
    ];

    const randomIndex = Math.floor(this.rng() * significanceOptions.length);
    return significanceOptions[randomIndex];
  }

  generateItemProperties(baseProperties, rarity) {
    const propertyOptions = [
      "durable",
      "sharp",
      "lightweight",
      "heavy",
      "flexible",
      "rigid",
      "waterproof",
      "fragile",
    ];
    const properties = [...baseProperties];

    // Add rarity-specific properties
    if (rarity === "rare" || rarity === "legendary") {
      properties.push("exceptional quality");
    }

    if (rarity === "legendary") {
      properties.push("mystical properties");
    }

    return properties;
  }

  generateItemDescription(baseDescription, rarity, properties) {
    const rarityDescriptions = {
      common: "A standard item",
      uncommon: "A well-crafted item",
      rare: "An exceptional item",
      legendary: "A legendary item",
    };

    const rarityDescription = rarityDescriptions[rarity] || baseDescription;
    const propertyDescription = properties.join(", ");

    return `${rarityDescription}. ${baseDescription}. Properties: ${propertyDescription}.`;
  }

  calculateItemValue(baseValue, rarity, properties) {
    let value = baseValue;

    // Apply rarity multiplier
    const rarityMultipliers = {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.5,
      legendary: 5.0,
    };

    value *= rarityMultipliers[rarity] || 1.0;

    // Apply property bonuses
    if (properties.includes("exceptional quality")) {
      value *= 1.5;
    }

    if (properties.includes("mystical properties")) {
      value *= 2.0;
    }

    return Math.floor(value);
  }
}

export default ContentGenerator;
