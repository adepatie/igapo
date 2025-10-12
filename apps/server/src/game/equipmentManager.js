/**
 * Equipment Management System for Igapó
 * Handles special items, weapons, tools, artifacts, and maps
 */

const EQUIPMENT_TEMPLATES = {
  weapons: [
    {
      id: "rusty_machete",
      name: "Rusty Machete",
      type: "weapon",
      rarity: "common",
      description:
        "A well-worn machete that's seen better days. Still sharp enough to clear jungle paths.",
      effects: { combat: 1.2, clearing: 1.3 },
      culturalSignificance: "Standard tool for river traders",
      basePrice: 50,
    },
    {
      id: "shotgun",
      name: "Double-Barrel Shotgun",
      type: "weapon",
      rarity: "uncommon",
      description:
        "A reliable shotgun for hunting and protection. Makes a loud statement.",
      effects: { combat: 2.0, hunting: 1.5, intimidation: 1.8 },
      culturalSignificance: "Imported from coastal traders",
      basePrice: 200,
    },
    {
      id: "ceremonial_spear",
      name: "Ceremonial Spear",
      type: "weapon",
      rarity: "rare",
      description:
        "An ornate spear with tribal markings. Grants respect among indigenous groups.",
      effects: { combat: 1.5, diplomacy: 1.4, cultural_respect: 1.6 },
      culturalSignificance: "Sacred to local tribes",
      basePrice: 300,
    },
  ],
  tools: [
    {
      id: "compass",
      name: "Brass Compass",
      type: "tool",
      rarity: "common",
      description:
        "A reliable compass for navigation. Essential for jungle travel.",
      effects: { navigation: 1.3, travel_speed: 1.1 },
      culturalSignificance: "Standard equipment for explorers",
      basePrice: 75,
    },
    {
      id: "binoculars",
      name: "Field Binoculars",
      type: "tool",
      rarity: "uncommon",
      description:
        "High-quality binoculars for spotting wildlife and dangers from afar.",
      effects: { scouting: 1.6, hunting: 1.2, safety: 1.3 },
      culturalSignificance: "Military surplus equipment",
      basePrice: 150,
    },
    {
      id: "medical_kit",
      name: "Field Medical Kit",
      type: "tool",
      rarity: "uncommon",
      description:
        "A comprehensive medical kit with bandages, antiseptics, and basic medicines.",
      effects: { healing: 1.8, survival: 1.4, party_morale: 1.2 },
      culturalSignificance: "Imported from European doctors",
      basePrice: 180,
    },
  ],
  artifacts: [
    {
      id: "ancient_map",
      name: "Ancient Map Fragment",
      type: "artifact",
      rarity: "rare",
      description:
        "A weathered map fragment showing hidden routes through the jungle.",
      effects: { navigation: 1.5, discovery: 1.4, secret_routes: 1.3 },
      culturalSignificance: "Pre-Columbian indigenous knowledge",
      basePrice: 400,
    },
    {
      id: "ceremonial_mask",
      name: "Ceremonial Mask",
      type: "artifact",
      rarity: "legendary",
      description:
        "A sacred mask that grants spiritual protection and tribal acceptance.",
      effects: {
        spiritual_protection: 1.8,
        tribal_acceptance: 2.0,
        cultural_respect: 1.6,
      },
      culturalSignificance: "Sacred to multiple tribes",
      basePrice: 800,
    },
    {
      id: "golden_compass",
      name: "Golden Compass",
      type: "artifact",
      rarity: "legendary",
      description:
        "A mystical compass that always points toward hidden treasures.",
      effects: { treasure_hunting: 2.0, navigation: 1.8, luck: 1.5 },
      culturalSignificance: "Legendary explorer's tool",
      basePrice: 1000,
    },
  ],
  maps: [
    {
      id: "river_chart",
      name: "River Navigation Chart",
      type: "map",
      rarity: "common",
      description: "A detailed chart of river routes and safe passages.",
      effects: { navigation: 1.2, travel_safety: 1.1 },
      culturalSignificance: "Standard pilot's reference",
      basePrice: 60,
    },
    {
      id: "tribal_territories",
      name: "Tribal Territories Map",
      type: "map",
      rarity: "uncommon",
      description:
        "A map showing indigenous territories and safe passage routes.",
      effects: { diplomacy: 1.3, travel_safety: 1.2, cultural_respect: 1.1 },
      culturalSignificance: "Created by friendly tribes",
      basePrice: 120,
    },
    {
      id: "treasure_map",
      name: "Treasure Map",
      type: "map",
      rarity: "rare",
      description:
        "A mysterious map leading to hidden caches and ancient sites.",
      effects: { treasure_hunting: 1.6, discovery: 1.4, exploration: 1.3 },
      culturalSignificance: "Legendary explorer's secret",
      basePrice: 250,
    },
  ],
};

class EquipmentManager {
  constructor() {
    this.templates = EQUIPMENT_TEMPLATES;
  }

  /**
   * Get all equipment for a session
   */
  getEquipment(sessionDb, sessionId) {
    const equipment = sessionDb
      .prepare(
        `
        SELECT item_id, item_type, name, description, rarity, effects, 
               cultural_significance, acquired_at, acquired_from
        FROM session_equipment 
        WHERE session_id = ?
        ORDER BY acquired_at DESC
      `
      )
      .all(sessionId);

    return equipment.map((item) => ({
      itemId: item.item_id,
      itemType: item.item_type,
      name: item.name,
      description: item.description,
      rarity: item.rarity,
      effects: JSON.parse(item.effects || "{}"),
      culturalSignificance: item.cultural_significance,
      acquiredAt: item.acquired_at,
      acquiredFrom: item.acquired_from,
    }));
  }

  /**
   * Add equipment to session
   */
  addEquipment(sessionDb, sessionId, itemId, acquiredFrom = null) {
    const template = this.findTemplate(itemId);
    if (!template) {
      throw new Error(`Equipment template not found: ${itemId}`);
    }

    const currentTime = Math.floor(Date.now() / 1000);

    sessionDb
      .prepare(
        `
        INSERT INTO session_equipment 
        (session_id, item_id, item_type, name, description, rarity, 
         effects, cultural_significance, acquired_at, acquired_from)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        sessionId,
        itemId,
        template.type,
        template.name,
        template.description,
        template.rarity,
        JSON.stringify(template.effects),
        template.culturalSignificance,
        currentTime,
        acquiredFrom
      );

    return {
      itemId,
      itemType: template.type,
      name: template.name,
      description: template.description,
      rarity: template.rarity,
      effects: template.effects,
      culturalSignificance: template.culturalSignificance,
      acquiredAt: currentTime,
      acquiredFrom: acquiredFrom,
    };
  }

  /**
   * Remove equipment from session
   */
  removeEquipment(sessionDb, sessionId, itemId) {
    const result = sessionDb
      .prepare(
        `
        DELETE FROM session_equipment 
        WHERE session_id = ? AND item_id = ?
      `
      )
      .run(sessionId, itemId);

    return result.changes > 0;
  }

  /**
   * Check if player has specific equipment
   */
  hasEquipment(sessionDb, sessionId, itemId) {
    const item = sessionDb
      .prepare(
        `
        SELECT item_id FROM session_equipment 
        WHERE session_id = ? AND item_id = ?
      `
      )
      .get(sessionId, itemId);

    return !!item;
  }

  /**
   * Get equipment effects for gameplay calculations
   */
  getEquipmentEffects(sessionDb, sessionId) {
    const equipment = this.getEquipment(sessionDb, sessionId);
    const effects = {};

    equipment.forEach((item) => {
      Object.keys(item.effects).forEach((effectType) => {
        if (!effects[effectType]) {
          effects[effectType] = 1.0;
        }
        effects[effectType] *= item.effects[effectType];
      });
    });

    return effects;
  }

  /**
   * Get equipment for specific encounter type
   */
  getEncounterEquipment(sessionDb, sessionId, encounterType) {
    const equipment = this.getEquipment(sessionDb, sessionId);
    const relevantItems = [];

    equipment.forEach((item) => {
      if (this.isRelevantForEncounter(item, encounterType)) {
        relevantItems.push(item);
      }
    });

    return relevantItems;
  }

  /**
   * Check if equipment is relevant for encounter type
   */
  isRelevantForEncounter(item, encounterType) {
    const encounterRelevance = {
      combat: ["weapon"],
      hunting: ["weapon", "tool"],
      navigation: ["tool", "map"],
      diplomacy: ["artifact"],
      exploration: ["tool", "map", "artifact"],
      survival: ["tool"],
    };

    const relevantTypes = encounterRelevance[encounterType] || [];
    return relevantTypes.includes(item.itemType);
  }

  /**
   * Find equipment template by ID
   */
  findTemplate(itemId) {
    for (const category of Object.values(this.templates)) {
      const template = category.find((item) => item.id === itemId);
      if (template) return template;
    }
    return null;
  }

  /**
   * Get available equipment by rarity and location
   */
  getAvailableEquipment(locationType, rarity = null) {
    const available = [];

    Object.values(this.templates).forEach((category) => {
      category.forEach((item) => {
        if (rarity && item.rarity !== rarity) return;
        if (this.isAvailableAtLocation(item, locationType)) {
          available.push(item);
        }
      });
    });

    return available;
  }

  /**
   * Check if equipment is available at location type
   */
  isAvailableAtLocation(item, locationType) {
    const locationAvailability = {
      "riverside town": ["weapon", "tool", "map"],
      "riverside settlement": ["weapon", "tool"],
      "protected wilderness": ["tool", "artifact"],
      "towering jungle": ["weapon", "tool", "artifact"],
      "parrot gathering site": ["artifact"],
      "natural phenomenon": ["artifact", "map"],
    };

    const availableTypes = locationAvailability[locationType] || [];
    return availableTypes.includes(item.type);
  }

  /**
   * Calculate equipment value for trading
   */
  calculateEquipmentValue(item, condition = 1.0) {
    const baseValue = item.basePrice || 100;
    const rarityMultiplier = {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.5,
      legendary: 5.0,
    };

    return Math.floor(baseValue * rarityMultiplier[item.rarity] * condition);
  }

  /**
   * Generate random equipment drop
   */
  generateRandomDrop(locationType, playerLevel = 1) {
    const available = this.getAvailableEquipment(locationType);
    if (available.length === 0) return null;

    // Weight by rarity and player level
    const weightedItems = [];
    available.forEach((item) => {
      const weight = this.getDropWeight(item, playerLevel);
      for (let i = 0; i < weight; i++) {
        weightedItems.push(item);
      }
    });

    if (weightedItems.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * weightedItems.length);
    return weightedItems[randomIndex];
  }

  /**
   * Get drop weight for equipment based on rarity and player level
   */
  getDropWeight(item, playerLevel) {
    const rarityWeights = {
      common: 10,
      uncommon: 5,
      rare: 2,
      legendary: 1,
    };

    const baseWeight = rarityWeights[item.rarity];
    const levelBonus = Math.max(0, playerLevel - 1) * 0.5;

    return Math.floor(baseWeight + levelBonus);
  }
}

export default EquipmentManager;
