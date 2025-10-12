/**
 * Session Database Schema
 * Defines tables for per-session character data that resets with each game
 */

/**
 * Create session-specific tables in an in-memory database
 * @param {Database} sessionDb - Better-sqlite3 database instance (in-memory)
 */
export function createSessionTables(sessionDb) {
  // Session metadata
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS session_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      player_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      game_started INTEGER DEFAULT 0,
      game_completed INTEGER DEFAULT 0,
      completion_status TEXT
    )
  `
    )
    .run();

  // Character relationships (per session)
  sessionDb
    .prepare(
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
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      UNIQUE(player_id, character_id)
    )
  `
    )
    .run();

  // Conversation memory (full history per session)
  sessionDb
    .prepare(
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
      timestamp INTEGER NOT NULL
    )
  `
    )
    .run();

  // Character state (dynamic per-session state)
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS character_state (
      character_id INTEGER PRIMARY KEY,
      current_location TEXT,
      current_mood TEXT DEFAULT 'neutral',
      last_seen_day INTEGER,
      notes TEXT
    )
  `
    )
    .run();

  // Supply tracking per session
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS session_supplies (
      session_id TEXT NOT NULL,
      supply_type TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      max_capacity REAL,
      last_consumed INTEGER,
      PRIMARY KEY (session_id, supply_type)
    )
  `
    )
    .run();

  // Survival state tracking
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS session_survival (
      session_id TEXT PRIMARY KEY,
      last_food_consumption INTEGER,
      last_water_consumption INTEGER,
      starvation_stage INTEGER DEFAULT 0,
      dehydration_stage INTEGER DEFAULT 0,
      survival_modifiers TEXT
    )
  `
    )
    .run();

  // Party/crew system
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS session_party (
      session_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      role TEXT NOT NULL,
      skills TEXT,
      stats TEXT,
      reputation_groups TEXT,
      recruited_at INTEGER,
      languages TEXT,
      PRIMARY KEY (session_id, character_id)
    )
  `
    )
    .run();

  // Economy system
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS session_economy (
      session_id TEXT PRIMARY KEY,
      currency_amount REAL DEFAULT 0,
      barter_goods TEXT
    )
  `
    )
    .run();

  // Weather system
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS session_weather (
      session_id TEXT PRIMARY KEY,
      current_weather TEXT DEFAULT 'normal',
      weather_intensity INTEGER DEFAULT 1,
      weather_start_time INTEGER,
      weather_duration_hours INTEGER DEFAULT 4,
      temperature REAL DEFAULT 25.0,
      last_update INTEGER
    )
  `
    )
    .run();

  // Minimap discovery system
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS session_minimap (
      session_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      discovered BOOLEAN DEFAULT FALSE,
      discovered_at INTEGER,
      PRIMARY KEY (session_id, location_id)
    )
  `
    )
    .run();

  // Camping system
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS session_camping (
      session_id TEXT PRIMARY KEY,
      camp_location TEXT,
      camp_setup_time INTEGER,
      camp_safety_level INTEGER DEFAULT 50,
      camp_events TEXT,
      last_camp_time INTEGER
    )
  `
    )
    .run();

  // Equipment system
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS session_equipment (
      session_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      rarity TEXT DEFAULT 'common',
      effects TEXT,
      cultural_significance TEXT,
      acquired_at INTEGER,
      acquired_from TEXT,
      PRIMARY KEY (session_id, item_id)
    )
  `
    )
    .run();

  // Travel tracking
  sessionDb
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS session_travel (
      session_id TEXT PRIMARY KEY,
      current_location TEXT,
      last_travel_time INTEGER,
      travel_distance REAL DEFAULT 0,
      travel_modifiers TEXT,
      retreat_count INTEGER DEFAULT 0
    )
  `
    )
    .run();

  // Create indexes for faster queries
  sessionDb
    .prepare(
      `
    CREATE INDEX IF NOT EXISTS idx_relationships_player_char 
    ON character_relationships(player_id, character_id)
  `
    )
    .run();

  sessionDb
    .prepare(
      `
    CREATE INDEX IF NOT EXISTS idx_conversations_player_char 
    ON conversation_memory(player_id, character_id)
  `
    )
    .run();

  sessionDb
    .prepare(
      `
    CREATE INDEX IF NOT EXISTS idx_conversations_timestamp 
    ON conversation_memory(timestamp DESC)
  `
    )
    .run();

  console.log("✅ Session tables created successfully");
}

/**
 * Get session statistics
 * @param {Database} sessionDb - Session database instance
 * @returns {Object} Session statistics
 */
export function getSessionStats(sessionDb) {
  const metadata = sessionDb
    .prepare("SELECT * FROM session_metadata LIMIT 1")
    .get();

  const relationshipCount = sessionDb
    .prepare("SELECT COUNT(*) as count FROM character_relationships")
    .get().count;

  const conversationCount = sessionDb
    .prepare("SELECT COUNT(*) as count FROM conversation_memory")
    .get().count;

  const characterStateCount = sessionDb
    .prepare("SELECT COUNT(*) as count FROM character_state")
    .get().count;

  return {
    metadata,
    relationshipCount,
    conversationCount,
    characterStateCount,
  };
}
