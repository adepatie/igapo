import Database from 'better-sqlite3';

const db = new Database('./data/amazon.db');

console.log('Testing database image URLs...\n');

const animals = db.prepare('SELECT common_name, scientific_name, image_url FROM animals LIMIT 5').all();

animals.forEach(animal => {
  console.log(`Animal: ${animal.common_name}`);
  console.log(`Scientific: ${animal.scientific_name}`);
  console.log(`Image URL: ${animal.image_url || 'NULL'}`);
  console.log('---');
});

db.close();
