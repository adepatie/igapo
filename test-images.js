import Database from "better-sqlite3";

const db = new Database("data/amazon.db");

// Get first 5 animals with their image URLs
const animals = db
  .prepare(
    "SELECT common_name, scientific_name, image_url FROM animals LIMIT 5"
  )
  .all();

console.log("Sample animals from database:");
animals.forEach((animal) => {
  console.log(`\n${animal.common_name} (${animal.scientific_name})`);
  console.log(`Image URL: ${animal.image_url}`);
});

db.close();
