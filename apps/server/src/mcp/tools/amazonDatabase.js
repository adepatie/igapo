/**
 * Basic Amazon database tool handlers
 * These tools provide access to locations, animals, and plants data
 */

/**
 * Get a random location from the database
 */
export async function getRandomLocation(params, db) {
  const location = db
    .prepare("SELECT * FROM locations ORDER BY RANDOM() LIMIT 1")
    .get();

  return location;
}

/**
 * Get random animals with optional filtering
 */
export async function getRandomAnimals(params, db) {
  const { count = 3, category, dangerLevel } = params;
  let query = "SELECT * FROM animals WHERE 1=1";
  const queryParams = [];

  if (category) {
    query += " AND category = ?";
    queryParams.push(category);
  }

  if (dangerLevel) {
    query += " AND danger_level = ?";
    queryParams.push(dangerLevel);
  }

  query += " ORDER BY RANDOM() LIMIT ?";
  queryParams.push(count);

  const animals = db.prepare(query).all(...queryParams);
  return animals;
}

/**
 * Get random plants with optional medicinal filter
 */
export async function getRandomPlants(params, db) {
  const { count = 2, medicinal } = params;
  let query = "SELECT * FROM plants";
  const queryParams = [];

  if (medicinal !== undefined) {
    query += " WHERE medicinal_use IS NOT NULL";
  }

  query += " ORDER BY RANDOM() LIMIT ?";
  queryParams.push(count);

  const plants = db.prepare(query).all(...queryParams);
  return plants;
}

/**
 * Get location by name or type
 */
export async function getLocation(params, db) {
  const { name, type, biome } = params;
  let query = "SELECT * FROM locations WHERE 1=1";
  const queryParams = [];

  if (name) {
    query += " AND name LIKE ?";
    queryParams.push(`%${name}%`);
  }

  if (type) {
    query += " AND type = ?";
    queryParams.push(type);
  }

  if (biome) {
    query += " AND biome LIKE ?";
    queryParams.push(`%${biome}%`);
  }

  query += " LIMIT 1";

  const location = db.prepare(query).get(...queryParams);
  return location || null;
}

/**
 * Search animals by name or category
 */
export async function searchAnimals(params, db) {
  const { name, category, limit = 5 } = params;
  let query = "SELECT * FROM animals WHERE 1=1";
  const queryParams = [];

  if (name) {
    query += " AND common_name LIKE ?";
    queryParams.push(`%${name}%`);
  }

  if (category) {
    query += " AND category = ?";
    queryParams.push(category);
  }

  query += " LIMIT ?";
  queryParams.push(limit);

  const animals = db.prepare(query).all(...queryParams);
  return animals;
}

/**
 * Search plants by name or medicinal use
 */
export async function searchPlants(params, db) {
  const { name, medicinalUse, limit = 5 } = params;
  let query = "SELECT * FROM plants WHERE 1=1";
  const queryParams = [];

  if (name) {
    query += " AND common_name LIKE ?";
    queryParams.push(`%${name}%`);
  }

  if (medicinalUse) {
    query += " AND medicinal_use LIKE ?";
    queryParams.push(`%${medicinalUse}%`);
  }

  query += " LIMIT ?";
  queryParams.push(limit);

  const plants = db.prepare(query).all(...queryParams);
  return plants;
}

/**
 * Get all locations in a specific biome
 */
export async function getLocationsByBiome(params, db) {
  const { biome } = params;

  const locations = db
    .prepare("SELECT * FROM locations WHERE biome LIKE ? ORDER BY name")
    .all(`%${biome}%`);

  return locations;
}

/**
 * Get dangerous animals for encounter generation
 */
export async function getDangerousAnimals(params, db) {
  const { count = 5, minDangerLevel = 5 } = params;

  const animals = db
    .prepare(
      `
      SELECT * FROM animals 
      WHERE danger_level >= ? 
      ORDER BY RANDOM() 
      LIMIT ?
    `
    )
    .all(minDangerLevel, count);

  return animals;
}
