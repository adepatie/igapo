import { getDatabase } from "./initDatabase.js";

/**
 * Get a random character suitable for the current location/context
 */
export function getCharacterForScene(options = {}) {
  const db = getDatabase();
  const { location, rolePreference, excludeIds = [] } = options;

  let query = "SELECT * FROM characters WHERE 1=1";
  const params = [];

  // Filter by role if specified
  if (rolePreference) {
    query += " AND role = ?";
    params.push(rolePreference);
  }

  // Exclude recently seen characters
  if (excludeIds.length > 0) {
    const placeholders = excludeIds.map(() => "?").join(",");
    query += ` AND id NOT IN (${placeholders})`;
    params.push(...excludeIds);
  }

  // Filter by spawn location if specified
  if (location) {
    query += " AND (spawn_locations LIKE ? OR spawn_locations LIKE ?)";
    params.push(`%${location}%`, "%all_%");
  }

  query += " ORDER BY RANDOM() LIMIT 1";

  const character = db.prepare(query).get(...params);

  if (!character) {
    // Fallback to any character if no match found
    return db
      .prepare("SELECT * FROM characters ORDER BY RANDOM() LIMIT 1")
      .get();
  }

  return character;
}

/**
 * Get a specific character by ID
 */
export function getCharacterById(characterId) {
  const db = getDatabase();
  return db.prepare("SELECT * FROM characters WHERE id = ?").get(characterId);
}

/**
 * Get all characters (for testing/admin)
 */
export function getAllCharacters() {
  const db = getDatabase();
  return db.prepare("SELECT * FROM characters").all();
}

/**
 * Parse character fields that are stored as comma-separated strings
 */
export function parseCharacterData(character) {
  if (!character) return null;

  return {
    ...character,
    typical_knowledge: character.typical_knowledge
      ? character.typical_knowledge.split(",")
      : [],
    spawn_locations: character.spawn_locations
      ? character.spawn_locations.split(",")
      : [],
    available_moods: character.available_moods
      ? character.available_moods.split(",")
      : ["neutral"],
  };
}
