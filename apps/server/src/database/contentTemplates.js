/**
 * Content Templates Database for Igapó
 * Stores procedural generation templates for characters, locations, animals, and items
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

class ContentTemplates {
  constructor(dbPath = null) {
    if (!dbPath) {
      // Use the same path resolution as initDatabase.js
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      dbPath = path.join(__dirname, "../../../../data/amazon.db");
    }

    try {
      this.db = new Database(dbPath);
      this.initializeTables();
    } catch (error) {
      console.error("Failed to open ContentTemplates database:", error.message);
      throw error;
    }
  }

  /**
   * Initialize content template tables
   */
  initializeTables() {
    // Character templates table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS character_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        rarity TEXT NOT NULL,
        biome TEXT NOT NULL,
        base_weight INTEGER DEFAULT 1,
        difficulty INTEGER DEFAULT 1,
        stats TEXT NOT NULL,
        personality_base TEXT NOT NULL,
        appearance_base TEXT NOT NULL,
        background_base TEXT NOT NULL,
        skills TEXT NOT NULL,
        languages TEXT NOT NULL,
        beliefs TEXT NOT NULL,
        cultural_context TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Location templates table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS location_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        rarity TEXT NOT NULL,
        biome TEXT NOT NULL,
        base_weight INTEGER DEFAULT 1,
        difficulty INTEGER DEFAULT 1,
        features TEXT NOT NULL,
        resources TEXT NOT NULL,
        encounters TEXT NOT NULL,
        description_base TEXT NOT NULL,
        connections TEXT NOT NULL,
        cultural_context TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Animal templates table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS animal_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        rarity TEXT NOT NULL,
        biome TEXT NOT NULL,
        base_weight INTEGER DEFAULT 1,
        difficulty INTEGER DEFAULT 1,
        behavior_base TEXT NOT NULL,
        interactions TEXT NOT NULL,
        rewards TEXT NOT NULL,
        description_base TEXT NOT NULL,
        cultural_context TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Item templates table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS item_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        rarity TEXT NOT NULL,
        biome TEXT NOT NULL,
        base_weight INTEGER DEFAULT 1,
        base_value INTEGER DEFAULT 1,
        properties TEXT NOT NULL,
        description_base TEXT NOT NULL,
        cultural_significance TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create indexes for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_character_templates_biome ON character_templates(biome);
      CREATE INDEX IF NOT EXISTS idx_character_templates_type ON character_templates(type);
      CREATE INDEX IF NOT EXISTS idx_character_templates_rarity ON character_templates(rarity);
      
      CREATE INDEX IF NOT EXISTS idx_location_templates_biome ON location_templates(biome);
      CREATE INDEX IF NOT EXISTS idx_location_templates_type ON location_templates(type);
      CREATE INDEX IF NOT EXISTS idx_location_templates_rarity ON location_templates(rarity);
      
      CREATE INDEX IF NOT EXISTS idx_animal_templates_biome ON animal_templates(biome);
      CREATE INDEX IF NOT EXISTS idx_animal_templates_type ON animal_templates(type);
      CREATE INDEX IF NOT EXISTS idx_animal_templates_rarity ON animal_templates(rarity);
      
      CREATE INDEX IF NOT EXISTS idx_item_templates_biome ON item_templates(biome);
      CREATE INDEX IF NOT EXISTS idx_item_templates_type ON item_templates(type);
      CREATE INDEX IF NOT EXISTS idx_item_templates_rarity ON item_templates(rarity);
    `);
  }

  /**
   * Get character templates by biome and type
   */
  getCharacterTemplates(biome, type = null, rarity = null) {
    let query = `
      SELECT * FROM character_templates 
      WHERE biome = ?
    `;
    const params = [biome];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    if (rarity) {
      query += ` AND rarity = ?`;
      params.push(rarity);
    }

    query += ` ORDER BY base_weight DESC, difficulty ASC`;

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.parseCharacterTemplate(row));
  }

  /**
   * Get location templates by biome and type
   */
  getLocationTemplates(biome, type = null, rarity = null) {
    let query = `
      SELECT * FROM location_templates 
      WHERE biome = ?
    `;
    const params = [biome];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    if (rarity) {
      query += ` AND rarity = ?`;
      params.push(rarity);
    }

    query += ` ORDER BY base_weight DESC, difficulty ASC`;

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.parseLocationTemplate(row));
  }

  /**
   * Get animal templates by biome and type
   */
  getAnimalTemplates(biome, type = null, rarity = null) {
    let query = `
      SELECT * FROM animal_templates 
      WHERE biome = ?
    `;
    const params = [biome];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    if (rarity) {
      query += ` AND rarity = ?`;
      params.push(rarity);
    }

    query += ` ORDER BY base_weight DESC, difficulty ASC`;

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.parseAnimalTemplate(row));
  }

  /**
   * Get item templates by biome and type
   */
  getItemTemplates(biome, type = null, rarity = null) {
    let query = `
      SELECT * FROM item_templates 
      WHERE biome = ?
    `;
    const params = [biome];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    if (rarity) {
      query += ` AND rarity = ?`;
      params.push(rarity);
    }

    query += ` ORDER BY base_weight DESC, rarity ASC`;

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.parseItemTemplate(row));
  }

  /**
   * Add character template
   */
  addCharacterTemplate(template) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO character_templates (
        id, name, type, rarity, biome, base_weight, difficulty,
        stats, personality_base, appearance_base, background_base,
        skills, languages, beliefs, cultural_context, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

    return stmt.run(
      template.id,
      template.name,
      template.type,
      template.rarity,
      template.biome,
      template.baseWeight || 1,
      template.difficulty || 1,
      JSON.stringify(template.stats),
      JSON.stringify(template.personalityBase),
      JSON.stringify(template.appearanceBase),
      template.backgroundBase,
      JSON.stringify(template.skills),
      JSON.stringify(template.languages),
      JSON.stringify(template.beliefs),
      template.culturalContext || null
    );
  }

  /**
   * Add location template
   */
  addLocationTemplate(template) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO location_templates (
        id, name, type, rarity, biome, base_weight, difficulty,
        features, resources, encounters, description_base, connections,
        cultural_context, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

    return stmt.run(
      template.id,
      template.name,
      template.type,
      template.rarity,
      template.biome,
      template.baseWeight || 1,
      template.difficulty || 1,
      JSON.stringify(template.features),
      JSON.stringify(template.resources),
      JSON.stringify(template.encounters),
      template.descriptionBase,
      JSON.stringify(template.connections),
      template.culturalContext || null
    );
  }

  /**
   * Add animal template
   */
  addAnimalTemplate(template) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO animal_templates (
        id, name, type, rarity, biome, base_weight, difficulty,
        behavior_base, interactions, rewards, description_base,
        cultural_context, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

    return stmt.run(
      template.id,
      template.name,
      template.type,
      template.rarity,
      template.biome,
      template.baseWeight || 1,
      template.difficulty || 1,
      JSON.stringify(template.behaviorBase),
      JSON.stringify(template.interactions),
      JSON.stringify(template.rewards),
      template.descriptionBase,
      template.culturalContext || null
    );
  }

  /**
   * Add item template
   */
  addItemTemplate(template) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO item_templates (
        id, name, type, rarity, biome, base_weight, base_value,
        properties, description_base, cultural_significance, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

    return stmt.run(
      template.id,
      template.name,
      template.type,
      template.rarity,
      template.biome,
      template.baseWeight || 1,
      template.baseValue || 1,
      JSON.stringify(template.properties),
      template.descriptionBase,
      template.culturalSignificance || null
    );
  }

  /**
   * Parse character template from database row
   */
  parseCharacterTemplate(row) {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      rarity: row.rarity,
      biome: row.biome,
      baseWeight: row.base_weight,
      difficulty: row.difficulty,
      stats: JSON.parse(row.stats),
      personalityBase: JSON.parse(row.personality_base),
      appearanceBase: JSON.parse(row.appearance_base),
      backgroundBase: row.background_base,
      skills: JSON.parse(row.skills),
      languages: JSON.parse(row.languages),
      beliefs: JSON.parse(row.beliefs),
      culturalContext: row.cultural_context
        ? JSON.parse(row.cultural_context)
        : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Parse location template from database row
   */
  parseLocationTemplate(row) {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      rarity: row.rarity,
      biome: row.biome,
      baseWeight: row.base_weight,
      difficulty: row.difficulty,
      features: JSON.parse(row.features),
      resources: JSON.parse(row.resources),
      encounters: JSON.parse(row.encounters),
      descriptionBase: row.description_base,
      connections: JSON.parse(row.connections),
      culturalContext: row.cultural_context
        ? JSON.parse(row.cultural_context)
        : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Parse animal template from database row
   */
  parseAnimalTemplate(row) {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      rarity: row.rarity,
      biome: row.biome,
      baseWeight: row.base_weight,
      difficulty: row.difficulty,
      behaviorBase: JSON.parse(row.behavior_base),
      interactions: JSON.parse(row.interactions),
      rewards: JSON.parse(row.rewards),
      descriptionBase: row.description_base,
      culturalContext: row.cultural_context
        ? JSON.parse(row.cultural_context)
        : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Parse item template from database row
   */
  parseItemTemplate(row) {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      rarity: row.rarity,
      biome: row.biome,
      baseWeight: row.base_weight,
      baseValue: row.base_value,
      properties: JSON.parse(row.properties),
      descriptionBase: row.description_base,
      culturalSignificance: row.cultural_significance,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Seed database with initial templates
   */
  seedTemplates() {
    // Character templates
    const characterTemplates = [
      {
        id: "merchant_001",
        name: "River Trader",
        type: "merchant",
        rarity: "common",
        biome: "riverside town",
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
      {
        id: "guide_001",
        name: "Indigenous Guide",
        type: "guide",
        rarity: "uncommon",
        biome: "protected wilderness",
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
      {
        id: "traveler_001",
        name: "Fellow Traveler",
        type: "traveler",
        rarity: "common",
        biome: "default",
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
    ];

    // Location templates
    const locationTemplates = [
      {
        id: "town_001",
        name: "River Settlement",
        type: "settlement",
        rarity: "common",
        biome: "riverside town",
        baseWeight: 10,
        difficulty: 1,
        features: ["market", "dock", "inn"],
        resources: ["food", "water", "supplies"],
        encounters: ["merchants", "travelers", "officials"],
        descriptionBase: "A bustling riverside community",
        connections: ["river", "road", "bridge"],
      },
      {
        id: "wilderness_001",
        name: "Sacred Grove",
        type: "wilderness",
        rarity: "uncommon",
        biome: "protected wilderness",
        baseWeight: 5,
        difficulty: 2,
        features: ["ancient trees", "spiritual sites", "wildlife"],
        resources: ["medicinal plants", "fresh water", "shelter"],
        encounters: ["wildlife", "spirits", "guardians"],
        descriptionBase: "A pristine wilderness area",
        connections: ["trail", "river", "hidden path"],
      },
      {
        id: "generic_001",
        name: "Unknown Location",
        type: "generic",
        rarity: "common",
        biome: "default",
        baseWeight: 8,
        difficulty: 1,
        features: ["basic shelter", "water source"],
        resources: ["water", "basic supplies"],
        encounters: ["wildlife", "travelers"],
        descriptionBase: "A remote location",
        connections: ["trail", "river"],
      },
    ];

    // Animal templates
    const animalTemplates = [
      {
        id: "bird_001",
        name: "River Kingfisher",
        type: "bird",
        rarity: "common",
        biome: "riverside town",
        baseWeight: 10,
        difficulty: 1,
        behaviorBase: ["hunting", "perching", "flying"],
        interactions: ["observe", "photograph", "feed"],
        rewards: ["feathers", "knowledge"],
        descriptionBase: "A colorful bird hunting fish",
      },
      {
        id: "mammal_001",
        name: "Jaguar",
        type: "predator",
        rarity: "rare",
        biome: "protected wilderness",
        baseWeight: 2,
        difficulty: 4,
        behaviorBase: ["hunting", "territorial", "stealth"],
        interactions: ["avoid", "observe", "confront"],
        rewards: ["fur", "claws", "respect"],
        descriptionBase: "A powerful jungle predator",
      },
      {
        id: "generic_001",
        name: "Wildlife",
        type: "generic",
        rarity: "common",
        biome: "default",
        baseWeight: 8,
        difficulty: 1,
        behaviorBase: ["foraging", "alert", "fleeing"],
        interactions: ["observe", "approach", "avoid"],
        rewards: ["knowledge", "materials"],
        descriptionBase: "Local wildlife",
      },
    ];

    // Item templates
    const itemTemplates = [
      {
        id: "tool_001",
        name: "River Compass",
        type: "tool",
        rarity: "common",
        biome: "riverside town",
        baseWeight: 10,
        baseValue: 50,
        properties: ["navigation", "durability"],
        descriptionBase: "A reliable navigation tool",
        culturalSignificance: "essential for river travel",
      },
      {
        id: "artifact_001",
        name: "Sacred Stone",
        type: "artifact",
        rarity: "rare",
        biome: "protected wilderness",
        baseWeight: 3,
        baseValue: 200,
        properties: ["spiritual", "protective"],
        descriptionBase: "A stone with spiritual significance",
        culturalSignificance: "sacred to local tribes",
      },
      {
        id: "generic_001",
        name: "Found Item",
        type: "generic",
        rarity: "common",
        biome: "default",
        baseWeight: 8,
        baseValue: 25,
        properties: ["useful", "basic"],
        descriptionBase: "A useful item",
        culturalSignificance: "common in the region",
      },
    ];

    // Insert templates
    characterTemplates.forEach((template) =>
      this.addCharacterTemplate(template)
    );
    locationTemplates.forEach((template) => this.addLocationTemplate(template));
    animalTemplates.forEach((template) => this.addAnimalTemplate(template));
    itemTemplates.forEach((template) => this.addItemTemplate(template));

    console.log("✅ Content templates seeded successfully");
  }

  /**
   * Get template count by type
   */
  getTemplateCounts() {
    const counts = {};

    counts.characters = this.db
      .prepare("SELECT COUNT(*) as count FROM character_templates")
      .get().count;
    counts.locations = this.db
      .prepare("SELECT COUNT(*) as count FROM location_templates")
      .get().count;
    counts.animals = this.db
      .prepare("SELECT COUNT(*) as count FROM animal_templates")
      .get().count;
    counts.items = this.db
      .prepare("SELECT COUNT(*) as count FROM item_templates")
      .get().count;

    return counts;
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

export default ContentTemplates;
