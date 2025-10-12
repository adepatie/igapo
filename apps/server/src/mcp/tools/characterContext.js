/**
 * Character context tool handlers
 * Provides rich character information for dialogue generation
 * Now uses session DB for relationships and conversation history
 */

/**
 * Get comprehensive character dialogue context
 * Includes character info, relationship status, location context, and relevant knowledge
 * @param {Object} params - Query parameters
 * @param {Database} db - Main database (for character templates)
 * @param {Database} sessionDb - Session database (for relationships and conversations)
 */
export async function getCharacterDialogueContext(params, db, sessionDb) {
  const { characterId, playerId, location, gameDay } = params;

  // Validate session DB
  if (!sessionDb) {
    throw new Error("Session database not provided");
  }

  // Get character details
  const character = db
    .prepare("SELECT * FROM characters WHERE id = ?")
    .get(characterId);

  if (!character) {
    throw new Error(`Character not found: ${characterId}`);
  }

  // Parse JSON fields
  character.available_moods = character.available_moods
    ? character.available_moods.split(",").map((m) => m.trim())
    : ["neutral", "happy", "thoughtful"];

  character.spawn_locations = character.spawn_locations
    ? character.spawn_locations.split(",").map((l) => l.trim())
    : [];

  // Get or create relationship (from session DB)
  let relationship = sessionDb
    .prepare(
      `
      SELECT * FROM character_relationships 
      WHERE player_id = ? AND character_id = ?
    `
    )
    .get(playerId, characterId);

  if (!relationship) {
    // First time meeting - create relationship in session DB
    const now = Date.now();
    sessionDb
      .prepare(
        `
      INSERT INTO character_relationships 
      (player_id, character_id, relationship_level, trust_level, first_met_location, first_met_day, last_interaction_day, total_interactions, created_at, updated_at)
      VALUES (?, ?, 0, 0, ?, ?, ?, 1, ?, ?)
    `
      )
      .run(
        playerId,
        characterId,
        location || "unknown",
        gameDay || 1,
        gameDay || 1,
        now,
        now
      );

    relationship = {
      player_id: playerId,
      character_id: characterId,
      relationship_level: 0,
      trust_level: 0,
      total_interactions: 1,
      shared_secrets: null,
      reputation_tags: null,
      first_met_location: location,
      first_met_day: gameDay,
      last_interaction_day: gameDay,
    };
  } else {
    // Update interaction count and day in session DB
    sessionDb
      .prepare(
        `
      UPDATE character_relationships 
      SET total_interactions = total_interactions + 1,
          last_interaction_day = ?,
          updated_at = ?
      WHERE player_id = ? AND character_id = ?
    `
      )
      .run(gameDay, Date.now(), playerId, characterId);
  }

  // Parse relationship JSON fields
  relationship.shared_secrets = relationship.shared_secrets
    ? JSON.parse(relationship.shared_secrets)
    : [];
  relationship.reputation_tags = relationship.reputation_tags
    ? JSON.parse(relationship.reputation_tags)
    : [];

  // Get location context
  let locationContext = null;
  if (location) {
    locationContext = db
      .prepare("SELECT * FROM locations WHERE name LIKE ?")
      .get(`%${location}%`);
  }

  // Get recent conversation history (from session DB)
  const conversationHistory = sessionDb
    .prepare(
      `
      SELECT * FROM conversation_memory
      WHERE player_id = ? AND character_id = ?
      ORDER BY timestamp DESC
      LIMIT 5
    `
    )
    .all(playerId, characterId);

  // Get available character knowledge based on relationship
  const availableKnowledge = db
    .prepare(
      `
      SELECT * FROM character_knowledge
      WHERE character_id = ? 
      AND is_revealed = 0
    `
    )
    .all(characterId);

  // Filter knowledge by reveal conditions
  const revealableKnowledge = availableKnowledge.filter((knowledge) => {
    if (!knowledge.reveal_condition) return true;

    try {
      const condition = JSON.parse(knowledge.reveal_condition);
      if (
        condition.relationship_min &&
        relationship.relationship_level < condition.relationship_min
      ) {
        return false;
      }
      if (
        condition.trust_min &&
        relationship.trust_level < condition.trust_min
      ) {
        return false;
      }
      if (condition.flags_required) {
        const hasAllFlags = condition.flags_required.every((flag) =>
          relationship.reputation_tags.includes(flag)
        );
        if (!hasAllFlags) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  });

  // Get relevant rumors this character knows
  const knownRumors = db
    .prepare(
      `
      SELECT * FROM rumors
      WHERE known_by LIKE ? 
      AND (expires_day IS NULL OR expires_day > ?)
    `
    )
    .all(`%${characterId}%`, gameDay || 1);

  // Get recent player actions that this character might know about
  const recentActions = db
    .prepare(
      `
      SELECT * FROM player_actions
      WHERE player_id = ?
      AND (visibility = 'public' OR witnesses LIKE ?)
      ORDER BY timestamp DESC
      LIMIT 3
    `
    )
    .all(playerId, `%${characterId}%`);

  return {
    character: {
      id: character.id,
      name: character.name,
      role: character.role,
      archetype: character.archetype,
      description: character.description,
      backstory_template: character.backstory_template,
      typical_knowledge: character.typical_knowledge,
      available_moods: character.available_moods,
      background_image: character.background_image,
    },
    relationship: {
      level: relationship.relationship_level,
      trust: relationship.trust_level,
      total_interactions: relationship.total_interactions,
      shared_secrets: relationship.shared_secrets,
      reputation_tags: relationship.reputation_tags,
      first_met: {
        location: relationship.first_met_location,
        day: relationship.first_met_day,
      },
      last_interaction_day: relationship.last_interaction_day,
      is_first_meeting: relationship.total_interactions <= 1,
    },
    context: {
      location: locationContext
        ? {
            name: locationContext.name,
            type: locationContext.type,
            biome: locationContext.biome,
            description: locationContext.description,
            dangers: locationContext.dangers,
            resources: locationContext.resources,
          }
        : null,
      current_day: gameDay,
    },
    available_knowledge: revealableKnowledge.map((k) => ({
      id: k.id,
      type: k.knowledge_type,
      importance: k.importance,
      data: k.knowledge_data ? JSON.parse(k.knowledge_data) : null,
    })),
    known_rumors: knownRumors.map((r) => ({
      id: r.id,
      text: r.rumor_text,
      type: r.rumor_type,
      subject: r.subject,
      accuracy: r.accuracy,
    })),
    recent_player_actions: recentActions.map((a) => ({
      type: a.action_type,
      target: a.action_target,
      description: a.action_description,
      visibility: a.visibility,
      location: a.location,
      day: a.game_day,
    })),
    conversation_history: conversationHistory.map((c) => ({
      turn: c.turn_number,
      player_choice: c.player_choice_text,
      character_response: c.character_response,
      mood: c.character_mood,
      topics: c.topics_discussed ? JSON.parse(c.topics_discussed) : [],
    })),
  };
}

/**
 * Update character relationship based on dialogue outcome
 * @param {Object} params - Update parameters
 * @param {Database} db - Main database (for knowledge)
 * @param {Database} sessionDb - Session database (for relationships)
 */
export async function updateCharacterRelationship(params, db, sessionDb) {
  const {
    playerId,
    characterId,
    relationshipDelta = 0,
    trustDelta = 0,
    addReputationTag = null,
    revealKnowledgeId = null,
  } = params;

  // Validate session DB
  if (!sessionDb) {
    throw new Error("Session database not provided");
  }

  // Update relationship values in session DB
  if (relationshipDelta !== 0 || trustDelta !== 0) {
    sessionDb
      .prepare(
        `
      UPDATE character_relationships
      SET relationship_level = CASE 
          WHEN relationship_level + ? > 10 THEN 10
          WHEN relationship_level + ? < -10 THEN -10
          ELSE relationship_level + ?
        END,
        trust_level = CASE
          WHEN trust_level + ? > 100 THEN 100
          WHEN trust_level + ? < 0 THEN 0
          ELSE trust_level + ?
        END,
        updated_at = ?
      WHERE player_id = ? AND character_id = ?
    `
      )
      .run(
        relationshipDelta,
        relationshipDelta,
        relationshipDelta,
        trustDelta,
        trustDelta,
        trustDelta,
        Date.now(),
        playerId,
        characterId
      );
  }

  // Add reputation tag in session DB
  if (addReputationTag) {
    const current = sessionDb
      .prepare(
        "SELECT reputation_tags FROM character_relationships WHERE player_id = ? AND character_id = ?"
      )
      .get(playerId, characterId);

    const tags = current?.reputation_tags
      ? JSON.parse(current.reputation_tags)
      : [];
    if (!tags.includes(addReputationTag)) {
      tags.push(addReputationTag);
      sessionDb
        .prepare(
          `
        UPDATE character_relationships
        SET reputation_tags = ?,
            updated_at = ?
        WHERE player_id = ? AND character_id = ?
      `
        )
        .run(JSON.stringify(tags), Date.now(), playerId, characterId);
    }
  }

  // Mark knowledge as revealed in main DB (persistent)
  if (revealKnowledgeId) {
    db.prepare(
      `
      UPDATE character_knowledge
      SET is_revealed = 1,
          revealed_by = ?,
          revealed_day = ?
      WHERE id = ?
    `
    ).run(characterId, params.gameDay || 1, revealKnowledgeId);

    // Add to shared secrets
    const current = db
      .prepare(
        "SELECT shared_secrets FROM character_relationships WHERE player_id = ? AND character_id = ?"
      )
      .get(playerId, characterId);

    const secrets = current.shared_secrets
      ? JSON.parse(current.shared_secrets)
      : [];
    if (!secrets.includes(revealKnowledgeId)) {
      secrets.push(revealKnowledgeId);
      db.prepare(
        `
        UPDATE character_relationships
        SET shared_secrets = ?
        WHERE player_id = ? AND character_id = ?
      `
      ).run(JSON.stringify(secrets), playerId, characterId);
    }
  }

  return { success: true, message: "Relationship updated" };
}

/**
 * Record conversation turn in memory
 * @param {Object} params - Conversation data
 * @param {Database} db - Main database (not used, kept for compatibility)
 * @param {Database} sessionDb - Session database (for conversation memory)
 */
export async function recordConversationTurn(params, db, sessionDb) {
  const {
    playerId,
    characterId,
    sessionId,
    turnNumber,
    playerChoiceId,
    playerChoiceText,
    playerChoiceTone,
    characterResponse,
    characterMood,
    moodChangeReason,
    topicsDiscussed = [],
    knowledgeRevealed = [],
    relationshipDelta = 0,
    location,
    gameDay,
  } = params;

  // Validate session DB
  if (!sessionDb) {
    throw new Error("Session database not provided");
  }

  const id = `conv_${playerId}_${characterId}_${Date.now()}`;

  sessionDb
    .prepare(
      `
    INSERT INTO conversation_memory (
      id, player_id, character_id, session_id, turn_number,
      player_choice_id, player_choice_text, player_choice_tone,
      character_response, character_mood, mood_change_reason,
      topics_discussed, knowledge_revealed, relationship_delta,
      location, game_day, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      id,
      playerId,
      characterId,
      sessionId,
      turnNumber,
      playerChoiceId,
      playerChoiceText,
      playerChoiceTone,
      characterResponse,
      characterMood,
      moodChangeReason,
      JSON.stringify(topicsDiscussed),
      JSON.stringify(knowledgeRevealed),
      relationshipDelta,
      location,
      gameDay,
      Date.now()
    );

  return { success: true, conversationId: id };
}
