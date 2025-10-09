// Test the API response
async function testAPI() {
  try {
    // Start a game
    const startRes = await fetch("http://localhost:3001/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Test" }),
    });
    const { state } = await startRes.json();

    // Get dynamic turn
    const turnRes = await fetch("http://localhost:3001/api/dynamic-turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    const turnData = await turnRes.json();

    console.log("\n=== FULL TURN DATA ===");
    console.log(JSON.stringify(turnData, null, 2));
    console.log("\n=== IMAGE DATA ===");
    console.log("Has animalName:", !!turnData.animalName);
    console.log("animalName:", turnData.animalName);
    console.log("Has animalImage:", !!turnData.animalImage);
    console.log("animalImage:", turnData.animalImage);
    console.log("scientificName:", turnData.scientificName);
    console.log("educationalNote:", turnData.educationalNote);
  } catch (error) {
    console.error("Error:", error);
  }
}

testAPI();
