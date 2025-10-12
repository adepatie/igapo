import { expect, test } from "@playwright/test";

test.describe("UI Component Integration", () => {
  test("Phase 2-5 UI components render without crashing", async ({ page }) => {
    console.log("[E2E] Testing UI component integration...");

    // Mock the API calls to avoid server dependency
    await page.route("**/api/**", (route) => {
      // Return mock data for all API calls
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          state: {
            playerName: "UITest",
            location: "loreto",
            biome: "riverside town",
            morale: 75,
            stamina: 80,
            supplies: {
              food: 20,
              water: 30,
              medicine: 3,
              fuel: 10,
              tools: 5,
            },
            survival: {
              lastFoodConsumption: Date.now() / 1000,
              lastWaterConsumption: Date.now() / 1000,
              starvationStage: 0,
              dehydrationStage: 0,
              survivalModifiers: {},
            },
            party: [],
            economy: {
              currencyAmount: 1000,
              barterGoods: {},
            },
            weather: {
              type: "normal",
              intensity: 1,
              temperature: 25,
              effects: {
                travelSpeed: 1.0,
                encounterRisk: 1.0,
                supplyConsumption: 1.0,
              },
            },
            minimap: {
              discoveredLocations: ["loreto"],
              currentLocation: "loreto",
            },
            progress: 0,
            route: [
              {
                id: "loreto",
                name: "Loreto Dock",
                biome: "riverside town",
                description:
                  "A bustling hub where the Amazon's many tributaries converge.",
              },
            ],
            inventory: [],
            crew: [],
            knowledge: [],
            lastAction: null,
            status: "active",
            currentMode: "dialogue",
            modeContext: {
              dialogue: {
                characterId: null,
                turnNumber: 0,
                canExit: true,
                isConsequential: false,
              },
              action: {
                availableCategories: [
                  "movement",
                  "social",
                  "survival",
                  "special",
                ],
                lastCategory: null,
              },
              exploration: {
                areaId: null,
                itemsFound: [],
                turnsRemaining: 3,
              },
              encounter: {
                type: null,
                turnsRemaining: 0,
                resolved: false,
              },
              reflection: {
                type: null,
                triggered: false,
              },
            },
          },
          dialogue: {
            text: "Welcome to the Amazon! I am Maria, your guide for this journey. What brings you to these dangerous waters?",
            mood: "neutral",
            characterAction: "greets you with a warm smile",
            character: {
              id: "maria_guide",
              name: "Maria",
              role: "guide",
              archetype: "wise",
              description: "A knowledgeable local guide",
              backgroundImage: "/default-character-bg.png",
            },
            options: [
              {
                id: "option1",
                text: "I'm searching for Lágrimas da Lua to save my grandmother.",
                tone: "honest",
              },
              {
                id: "option2",
                text: "Just exploring the river. What can you tell me?",
                tone: "curious",
              },
            ],
          },
        }),
      });
    });

    await page.goto("/?player=UITest");
    console.log("[E2E] Page loaded");

    // === TEST 1: Layout Structure ===
    console.log("[E2E] === Testing layout structure ===");

    // Check if all Phase 2-5 UI components are present in DOM
    await expect(page.locator(".app-shell__pocketwatch")).toBeVisible();
    console.log("[E2E] ✓ Pocketwatch visible");

    await expect(page.locator(".app-shell__weather")).toBeVisible();
    console.log("[E2E] ✓ Weather indicator visible");

    await expect(page.locator(".app-shell__supplies")).toBeVisible();
    console.log("[E2E] ✓ Supply display visible");

    await expect(page.locator(".app-shell__survival")).toBeVisible();
    console.log("[E2E] ✓ Survival status visible");

    await expect(page.locator(".app-shell__party")).toBeVisible();
    console.log("[E2E] ✓ Party panel visible");

    await expect(page.locator(".app-shell__minimap")).toBeVisible();
    console.log("[E2E] ✓ Minimap visible");

    // === TEST 2: Component Content ===
    console.log("[E2E] === Testing component content ===");

    // Check if components have content (not just empty divs)
    const pocketwatchContent = await page
      .locator(".app-shell__pocketwatch")
      .textContent();
    expect(pocketwatchContent?.length).toBeGreaterThan(0);
    console.log("[E2E] ✓ Pocketwatch has content");

    const weatherContent = await page
      .locator(".app-shell__weather")
      .textContent();
    expect(weatherContent?.length).toBeGreaterThan(0);
    console.log("[E2E] ✓ Weather indicator has content");

    const suppliesContent = await page
      .locator(".app-shell__supplies")
      .textContent();
    expect(suppliesContent?.length).toBeGreaterThan(0);
    console.log("[E2E] ✓ Supply display has content");

    const survivalContent = await page
      .locator(".app-shell__survival")
      .textContent();
    expect(survivalContent?.length).toBeGreaterThan(0);
    console.log("[E2E] ✓ Survival status has content");

    const partyContent = await page.locator(".app-shell__party").textContent();
    expect(partyContent?.length).toBeGreaterThan(0);
    console.log("[E2E] ✓ Party panel has content");

    const minimapContent = await page
      .locator(".app-shell__minimap")
      .textContent();
    expect(minimapContent?.length).toBeGreaterThan(0);
    console.log("[E2E] ✓ Minimap has content");

    // === TEST 3: No JavaScript Errors ===
    console.log("[E2E] === Testing for JavaScript errors ===");

    // Check that no error messages are displayed
    const errorElements = page.locator(".error");
    const errorCount = await errorElements.count();
    expect(errorCount).toBe(0);
    console.log("[E2E] ✓ No error messages visible");

    // === TEST 4: Responsive Layout ===
    console.log("[E2E] === Testing responsive layout ===");

    // Check that the layout is using the expected CSS classes
    await expect(page.locator(".app-shell")).toBeVisible();
    await expect(page.locator(".app-shell__header")).toBeVisible();
    await expect(page.locator(".app-shell__main")).toBeVisible();
    await expect(page.locator(".app-shell__panels")).toBeVisible();
    console.log("[E2E] ✓ Layout structure correct");

    console.log("[E2E] 🎉 UI integration test completed successfully!");
    console.log("[E2E] All Phase 2-5 UI components are properly integrated!");
  });

  test("UI components handle missing data gracefully", async ({ page }) => {
    console.log("[E2E] Testing graceful degradation with missing data...");

    // Mock API calls with incomplete data
    await page.route("**/api/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          state: {
            playerName: "MissingDataTest",
            location: "loreto",
            biome: "riverside town",
            morale: 75,
            stamina: 80,
            // Missing supplies, weather, party, minimap data
            progress: 0,
            route: [],
            inventory: [],
            crew: [],
            knowledge: [],
            currentMode: "dialogue",
            modeContext: {
              dialogue: {
                characterId: null,
                turnNumber: 0,
                canExit: true,
                isConsequential: false,
              },
            },
          },
          dialogue: {
            text: "Welcome to the Amazon!",
            character: {
              id: "test_guide",
              name: "Test Guide",
            },
            options: [
              {
                id: "option1",
                text: "Hello!",
                tone: "friendly",
              },
            ],
          },
        }),
      });
    });

    await page.goto("/?player=MissingDataTest");

    // Components should still render without crashing
    await expect(page.locator(".app-shell__pocketwatch")).toBeVisible();
    await expect(page.locator(".app-shell__weather")).toBeVisible();
    await expect(page.locator(".app-shell__party")).toBeVisible();
    await expect(page.locator(".app-shell__minimap")).toBeVisible();

    // No error messages should appear
    const errorElements = page.locator(".error");
    const errorCount = await errorElements.count();
    expect(errorCount).toBe(0);
    console.log("[E2E] ✓ Components handle missing data gracefully");

    console.log("[E2E] Graceful degradation test completed!");
  });
});
