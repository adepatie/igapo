import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/amazon.db');
let db = null;

function getDb() {
  if (!db) {
    db = new Database(dbPath, { readonly: true });
  }
  return db;
}

export function getRandomLocation() {
  const database = getDb();
  const row = database.prepare(`
    SELECT * FROM locations 
    ORDER BY RANDOM() 
    LIMIT 1
  `).get();
  return row;
}

export function getRandomAnimals(count = 3, category = null, dangerLevel = null) {
  const database = getDb();
  let query = 'SELECT * FROM animals WHERE 1=1';
  const params = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (dangerLevel) {
    query += ' AND danger_level = ?';
    params.push(dangerLevel);
  }
  
  query += ' ORDER BY RANDOM() LIMIT ?';
  params.push(count);
  
  const rows = database.prepare(query).all(...params);
  return rows;
}

export function getRandomPlants(count = 2, medicinalOnly = false) {
  const database = getDb();
  let query = 'SELECT * FROM plants WHERE 1=1';
  
  if (medicinalOnly) {
    query += " AND medicinal_use IS NOT NULL AND medicinal_use != ''";
  }
  
  query += ' ORDER BY RANDOM() LIMIT ?';
  
  const rows = database.prepare(query).all(count);
  return rows;
}

export function searchByName(table, pattern) {
  const database = getDb();
  const validTables = ['locations', 'animals', 'plants'];
  
  if (!validTables.includes(table)) {
    throw new Error('Invalid table name');
  }
  
  const rows = database.prepare(`
    SELECT * FROM ${table} 
    WHERE name LIKE ? 
    LIMIT 10
  `).all(`%${pattern}%`);
  
  return rows;
}

export function getLocationDetails(identifier) {
  const database = getDb();
  
  // Try by ID first
  if (typeof identifier === 'number') {
    return database.prepare('SELECT * FROM locations WHERE id = ?').get(identifier);
  }
  
  // Try by name
  return database.prepare('SELECT * FROM locations WHERE name LIKE ?').get(`%${identifier}%`);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
