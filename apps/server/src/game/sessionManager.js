/**
 * Session Manager - Manages per-player in-memory session databases
 * Stores character relationships and conversation history that reset with each game
 */

import Database from "better-sqlite3";
import { createSessionTables } from "../database/sessionSchema.js";

// In-memory session storage
const activeSessions = new Map();

/**
 * Generate a unique session ID
 */
function generateSessionId(playerId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `session_${playerId}_${timestamp}_${random}`;
}

/**
 * Create a new session for a player
 * @param {string} playerId - Player identifier
 * @returns {Object} Session info with sessionId and database
 */
export function createSession(playerId) {
  // Generate unique session ID
  const sessionId = generateSessionId(playerId);

  // Create in-memory SQLite database for this session
  const sessionDb = new Database(":memory:");
  sessionDb.pragma("journal_mode = WAL");

  // Create session tables
  createSessionTables(sessionDb);

  // Store session metadata
  sessionDb
    .prepare(
      `
    INSERT INTO session_metadata (session_id, player_id, created_at)
    VALUES (?, ?, ?)
  `
    )
    .run(sessionId, playerId, Date.now());

  // Store session in active sessions map
  activeSessions.set(sessionId, {
    sessionId,
    playerId,
    db: sessionDb,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  });

  console.log(`[SessionManager] Created session ${sessionId} for ${playerId}`);

  return {
    sessionId,
    playerId,
    createdAt: Date.now(),
  };
}

/**
 * Get an existing session database
 * @param {string} sessionId - Session identifier
 * @returns {Database|null} Session database or null if not found
 */
export function getSessionDb(sessionId) {
  const session = activeSessions.get(sessionId);

  if (!session) {
    console.warn(`[SessionManager] Session ${sessionId} not found`);
    return null;
  }

  // Update last accessed time
  session.lastAccessedAt = Date.now();

  return session.db;
}

/**
 * Get session info without database
 * @param {string} sessionId - Session identifier
 * @returns {Object|null} Session metadata
 */
export function getSessionInfo(sessionId) {
  const session = activeSessions.get(sessionId);

  if (!session) {
    return null;
  }

  return {
    sessionId: session.sessionId,
    playerId: session.playerId,
    createdAt: session.createdAt,
    lastAccessedAt: session.lastAccessedAt,
  };
}

/**
 * Check if a session exists
 * @param {string} sessionId - Session identifier
 * @returns {boolean}
 */
export function sessionExists(sessionId) {
  return activeSessions.has(sessionId);
}

/**
 * Clear a session (for game reset)
 * @param {string} sessionId - Session identifier
 * @returns {boolean} True if session was cleared
 */
export function clearSession(sessionId) {
  const session = activeSessions.get(sessionId);

  if (!session) {
    console.warn(
      `[SessionManager] Cannot clear: session ${sessionId} not found`
    );
    return false;
  }

  // Close database connection
  try {
    session.db.close();
  } catch (err) {
    console.error(`[SessionManager] Error closing session DB:`, err);
  }

  // Remove from active sessions
  activeSessions.delete(sessionId);

  console.log(`[SessionManager] Cleared session ${sessionId}`);

  return true;
}

/**
 * Clear all sessions for a player
 * @param {string} playerId - Player identifier
 * @returns {number} Number of sessions cleared
 */
export function clearPlayerSessions(playerId) {
  let cleared = 0;

  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.playerId === playerId) {
      clearSession(sessionId);
      cleared++;
    }
  }

  console.log(`[SessionManager] Cleared ${cleared} sessions for ${playerId}`);

  return cleared;
}

/**
 * Get all active sessions (for debugging/admin)
 * @returns {Array} Array of session info objects
 */
export function getAllSessions() {
  return Array.from(activeSessions.values()).map((session) => ({
    sessionId: session.sessionId,
    playerId: session.playerId,
    createdAt: session.createdAt,
    lastAccessedAt: session.lastAccessedAt,
  }));
}

/**
 * Export session data to JSON (for save/load game)
 * @param {string} sessionId - Session identifier
 * @returns {Object|null} Session data as JSON
 */
export function exportSession(sessionId) {
  const sessionDb = getSessionDb(sessionId);
  const sessionInfo = getSessionInfo(sessionId);

  if (!sessionDb || !sessionInfo) {
    return null;
  }

  // Export all session tables
  const relationships = sessionDb
    .prepare("SELECT * FROM character_relationships")
    .all();
  const conversations = sessionDb
    .prepare("SELECT * FROM conversation_memory")
    .all();
  const characterStates = sessionDb
    .prepare("SELECT * FROM character_state")
    .all();

  return {
    sessionInfo,
    relationships,
    conversations,
    characterStates,
    exportedAt: Date.now(),
  };
}

/**
 * Import session data from JSON (for save/load game)
 * @param {Object} sessionData - Session data from exportSession
 * @returns {string|null} New session ID or null if failed
 */
export function importSession(sessionData) {
  const { sessionInfo, relationships, conversations, characterStates } =
    sessionData;

  // Create new session
  const newSession = createSession(sessionInfo.playerId);
  const sessionDb = getSessionDb(newSession.sessionId);

  if (!sessionDb) {
    return null;
  }

  try {
    // Import relationships
    const insertRelationship = sessionDb.prepare(`
      INSERT INTO character_relationships 
      (player_id, character_id, relationship_level, trust_level, total_interactions,
       shared_secrets, reputation_tags, first_met_location, first_met_day, 
       last_interaction_day, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const rel of relationships) {
      insertRelationship.run(
        rel.player_id,
        rel.character_id,
        rel.relationship_level,
        rel.trust_level,
        rel.total_interactions,
        rel.shared_secrets,
        rel.reputation_tags,
        rel.first_met_location,
        rel.first_met_day,
        rel.last_interaction_day,
        rel.created_at,
        rel.updated_at
      );
    }

    // Import conversations
    const insertConversation = sessionDb.prepare(`
      INSERT INTO conversation_memory 
      (id, player_id, character_id, session_id, turn_number, player_choice_id,
       player_choice_text, player_choice_tone, character_response, character_mood,
       mood_change_reason, topics_discussed, knowledge_revealed, relationship_delta,
       location, game_day, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const conv of conversations) {
      insertConversation.run(
        conv.id,
        conv.player_id,
        conv.character_id,
        newSession.sessionId, // Use new session ID
        conv.turn_number,
        conv.player_choice_id,
        conv.player_choice_text,
        conv.player_choice_tone,
        conv.character_response,
        conv.character_mood,
        conv.mood_change_reason,
        conv.topics_discussed,
        conv.knowledge_revealed,
        conv.relationship_delta,
        conv.location,
        conv.game_day,
        conv.timestamp
      );
    }

    // Import character states
    const insertState = sessionDb.prepare(`
      INSERT INTO character_state 
      (character_id, current_location, current_mood, last_seen_day, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const state of characterStates) {
      insertState.run(
        state.character_id,
        state.current_location,
        state.current_mood,
        state.last_seen_day,
        state.notes
      );
    }

    console.log(
      `[SessionManager] Imported session data into ${newSession.sessionId}`
    );

    return newSession.sessionId;
  } catch (err) {
    console.error(`[SessionManager] Error importing session:`, err);
    clearSession(newSession.sessionId);
    return null;
  }
}

/**
 * Clean up old inactive sessions (call periodically)
 * @param {number} maxAgeMs - Maximum age in milliseconds (default 24 hours)
 * @returns {number} Number of sessions cleaned up
 */
export function cleanupOldSessions(maxAgeMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, session] of activeSessions.entries()) {
    const age = now - session.lastAccessedAt;
    if (age > maxAgeMs) {
      clearSession(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[SessionManager] Cleaned up ${cleaned} old sessions`);
  }

  return cleaned;
}

// Start periodic cleanup (every hour)
let cleanupInterval = null;

export function startSessionCleanup() {
  if (cleanupInterval) {
    return;
  }

  cleanupInterval = setInterval(() => {
    cleanupOldSessions();
  }, 60 * 60 * 1000); // Every hour

  console.log("[SessionManager] Started periodic session cleanup");
}

export function stopSessionCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log("[SessionManager] Stopped periodic session cleanup");
  }
}
