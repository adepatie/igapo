/**
 * MCP Database Schema Extensions
 * Adds tables for character relationships, conversation memory, and dynamic world state
 */

/**
 * Create MCP-related tables in the database
 */
export function createMCPTables(db) {
  // Character relationships table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS character_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      character_id INTEGER NOT NULL,
      relationship_level INTEGER DEFAULT 0 CHECK (relationship_level BETWEEN -10 AND 10),
      trust_level INTEGER DEFAULT 0 CHECK (trust_level BETWEEN 0 AND 100),
      total_interactions INTEGER DEFAULT 0,
      shared_secrets TEXT,
      reputation_tags TEXT,
      first_met_location TEXT,
      first_met_day INTEGER,
      last_interaction_day INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (character_id) REFERENCES characters(id),
      UNIQUE(player_id, character_id)
    )
  `
  ).run();

  // Conversation memory table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS conversation_memory (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      character_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      turn_number INTEGER NOT NULL,
      player_choice_id TEXT,
      player_choice_text TEXT,
      player_choice_tone TEXT,
      character_response TEXT,
      character_mood TEXT,
      mood_change_reason TEXT,
      topics_discussed TEXT,
      knowledge_revealed TEXT,
      relationship_delta INTEGER DEFAULT 0,
      location TEXT,
      game_day INTEGER,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    )
  `
  ).run();

  // Character knowledge table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS character_knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      knowledge_type TEXT NOT NULL,
      knowledge_data TEXT NOT NULL,
      importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
      reveal_condition TEXT,
      is_revealed INTEGER DEFAULT 0,
      revealed_by INTEGER,
      revealed_day INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (character_id) REFERENCES characters(id)
    )
  `
  ).run();

  // Rumors table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS rumors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rumor_text TEXT NOT NULL,
      rumor_type TEXT NOT NULL,
      subject TEXT,
      accuracy REAL DEFAULT 0.5 CHECK (accuracy BETWEEN 0 AND 1),
      known_by TEXT,
      origin_character_id INTEGER,
      created_day INTEGER NOT NULL,
      expires_day INTEGER,
      has_spread INTEGER DEFAULT 0,
      FOREIGN KEY (origin_character_id) REFERENCES characters(id)
    )
  `
  ).run();

  // Player actions table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS player_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      action_target TEXT,
      action_description TEXT,
      visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'witnessed')),
      witnesses TEXT,
      location TEXT,
      game_day INTEGER NOT NULL,
      timestamp INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `
  ).run();

  // World events table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS world_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_description TEXT NOT NULL,
      location TEXT,
      affected_characters TEXT,
      trigger_day INTEGER NOT NULL,
      expiry_day INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `
  ).run();

  console.log("✅ MCP tables created successfully");
}

/**
 * Seed initial character knowledge and rumors
 */
export function seedMCPData(db) {
  // Seed knowledge for existing characters
  const characters = db.prepare("SELECT * FROM characters").all();

  characters.forEach((character) => {
    // Add basic knowledge entries based on character role
    const knowledgeEntries = generateKnowledgeForCharacter(character);

    knowledgeEntries.forEach((entry) => {
      try {
        db.prepare(
          `
          INSERT INTO character_knowledge 
          (character_id, knowledge_type, knowledge_data, importance, reveal_condition)
          VALUES (?, ?, ?, ?, ?)
        `
        ).run(
          character.id,
          entry.type,
          JSON.stringify(entry.data),
          entry.importance,
          entry.reveal_condition ? JSON.stringify(entry.reveal_condition) : null
        );
      } catch (e) {
        // Ignore duplicates
      }
    });
  });

  // Seed initial rumors
  const initialRumors = [
    {
      text: "There's a strange glow in the northern part of the forest at night",
      type: "mystery",
      subject: "Lágrimas da Lua",
      accuracy: 0.8,
      known_by: "1,2,3",
      origin_character_id: 1,
      created_day: 1,
    },
    {
      text: "The old hermit knows secrets about the ancient trees",
      type: "lore",
      subject: "forest_knowledge",
      accuracy: 0.9,
      known_by: "2,4",
      origin_character_id: 2,
      created_day: 1,
    },
    {
      text: "Jaguars have been spotted near the river more frequently",
      type: "danger",
      subject: "wildlife",
      accuracy: 1.0,
      known_by: "1,3,5",
      origin_character_id: 3,
      created_day: 1,
    },
  ];

  initialRumors.forEach((rumor) => {
    try {
      db.prepare(
        `
        INSERT INTO rumors 
        (rumor_text, rumor_type, subject, accuracy, known_by, origin_character_id, created_day)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        rumor.text,
        rumor.type,
        rumor.subject,
        rumor.accuracy,
        rumor.known_by,
        rumor.origin_character_id,
        rumor.created_day
      );
    } catch (e) {
      // Ignore duplicates
    }
  });

  console.log("✅ MCP data seeded successfully");
}

/**
 * Generate knowledge entries for a character based on their role/archetype
 */
function generateKnowledgeForCharacter(character) {
  const knowledge = [];

  // Role-based knowledge
  switch (character.role?.toLowerCase()) {
    case "guide":
      knowledge.push({
        type: "location_secret",
        data: {
          topic: "safe_paths",
          detail: "Hidden trails through dangerous territory",
        },
        importance: 7,
        reveal_condition: { relationship_min: 2 },
      });
      break;

    case "shaman":
      knowledge.push({
        type: "mystical_lore",
        data: {
          topic: "moon_tears",
          detail: "The true nature of Lágrimas da Lua",
        },
        importance: 9,
        reveal_condition: { relationship_min: 5, trust_min: 60 },
      });
      break;

    case "hunter":
      knowledge.push({
        type: "animal_behavior",
        data: {
          topic: "predator_patterns",
          detail: "When and where dangerous animals hunt",
        },
        importance: 6,
        reveal_condition: { relationship_min: 1 },
      });
      break;

    case "herbalist":
      knowledge.push({
        type: "plant_medicine",
        data: {
          topic: "healing_plants",
          detail: "Rare medicinal plants and their locations",
        },
        importance: 7,
        reveal_condition: { relationship_min: 2, trust_min: 40 },
      });
      break;
  }

  // Archetype-based knowledge
  switch (character.archetype?.toLowerCase()) {
    case "wise":
      knowledge.push({
        type: "story_fragment",
        data: {
          topic: "grandmother_past",
          detail: "Stories about your grandmother's youth",
        },
        importance: 8,
        reveal_condition: {
          relationship_min: 4,
          flags_required: ["trusted", "curious"],
        },
      });
      break;

    case "playful":
      knowledge.push({
        type: "local_gossip",
        data: {
          topic: "village_secrets",
          detail: "Amusing stories about other characters",
        },
        importance: 4,
        reveal_condition: { relationship_min: 1 },
      });
      break;

    case "suspicious":
      knowledge.push({
        type: "warning",
        data: {
          topic: "danger_ahead",
          detail: "Information about threats in the area",
        },
        importance: 6,
        reveal_condition: { trust_min: 50 },
      });
      break;
  }

  // Everyone knows something basic
  knowledge.push({
    type: "basic_info",
    data: {
      topic: "local_area",
      detail: `Information about the ${
        character.spawn_locations?.[0] || "area"
      }`,
    },
    importance: 3,
    reveal_condition: null, // Always available
  });

  return knowledge;
}

/**
 * Initialize all MCP tables and data
 */
export function initializeMCP(db) {
  createMCPTables(db);
  seedMCPData(db);
}
