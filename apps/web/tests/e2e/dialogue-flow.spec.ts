import { expect, test } from "@playwright/test";

test.describe("Dialogue Flow - Exposition to Character Dialogue", () => {
  test.beforeEach(async ({ page }) => {
    // Capture console messages for debugging
    page.on("console", (msg) => {
      console.log(`[Browser ${msg.type()}]`, msg.text());
    });

    // Capture page errors
    page.on("pageerror", (error) => {
      console.error("[Browser Error]", error.message);
    });

    // Capture failed requests
    page.on("requestfailed", (request) => {
      console.error(
        "[Request Failed]",
        request.url(),
        request.failure()?.errorText
      );
    });
  });

  test("should show exposition scene on initial load", async ({ page }) => {
    console.log("[E2E] Test 1: Loading page...");
    await page.goto("/?player=TestExplorer");

    console.log("[E2E] Test 1: Waiting for exposition scene...");

    // Check for exposition scene
    const expositionScene = page.getByTestId("exposition-scene");
    await expect(expositionScene).toBeVisible({ timeout: 10000 });
    console.log("[E2E] Test 1: ✓ Exposition scene visible");

    // Check for title
    await expect(page.getByText("The Igapó Expedition")).toBeVisible();
    console.log("[E2E] Test 1: ✓ Title visible");

    // Check for player name in content
    await expect(page.getByText(/TestExplorer/)).toBeVisible();
    console.log("[E2E] Test 1: ✓ Player name visible");

    // Check for grandmother's letter mention
    await expect(page.getByText(/grandmother/i)).toBeVisible();
    console.log("[E2E] Test 1: ✓ Grandmother mention visible");

    // Check for the flower name (should appear in the grandmother's letter)
    await expect(
      page
        .locator(".exposition-scene__narrative")
        .getByText(/Lágrimas da Lua/i)
        .first()
    ).toBeVisible();
    console.log("[E2E] Test 1: ✓ Flower name visible");

    // Check for continue button
    const continueButton = page.getByTestId("continue-button");
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveText(/Begin Your Journey/i);
    console.log("[E2E] Test 1: ✓ Continue button visible with correct text");
  });

  test("should transition from exposition to dialogue scene", async ({
    page,
  }) => {
    console.log("[E2E] Test 2: Loading page...");
    await page.goto("/?player=DialogueTest");

    console.log("[E2E] Test 2: Waiting for exposition...");
    const expositionScene = page.getByTestId("exposition-scene");
    await expect(expositionScene).toBeVisible({ timeout: 10000 });

    console.log("[E2E] Test 2: Clicking continue button...");
    const continueButton = page.getByTestId("continue-button");
    await continueButton.click();

    console.log("[E2E] Test 2: Waiting for dialogue scene...");

    // Exposition should disappear
    await expect(expositionScene).not.toBeVisible({ timeout: 10000 });
    console.log("[E2E] Test 2: ✓ Exposition disappeared");

    // Wait for dialogue scene to appear
    const dialogueScene = page.getByTestId("dialogue-scene");
    await expect(dialogueScene).toBeVisible({ timeout: 30000 }); // Longer timeout for API call
    console.log("[E2E] Test 2: ✓ Dialogue scene visible");
  });

  test("should display character with dialogue after exposition", async ({
    page,
  }) => {
    console.log("[E2E] Test 3: Loading page...");
    await page.goto("/?player=CharacterTest");

    console.log("[E2E] Test 3: Skipping exposition...");
    await page.getByTestId("continue-button").click();

    console.log("[E2E] Test 3: Waiting for dialogue scene...");
    const dialogueScene = page.getByTestId("dialogue-scene");
    await expect(dialogueScene).toBeVisible({ timeout: 30000 });

    // Check for character portrait section
    console.log("[E2E] Test 3: Checking for character portrait...");
    const characterPortrait = page.getByTestId("character-portrait");
    await expect(characterPortrait).toBeVisible({ timeout: 5000 });
    console.log("[E2E] Test 3: ✓ Character portrait visible");

    // Check for character name
    console.log("[E2E] Test 3: Checking for character name...");
    const characterName = page.locator(".character-name");
    await expect(characterName).toBeVisible();
    const nameText = await characterName.textContent();
    console.log("[E2E] Test 3: ✓ Character name:", nameText);

    // Check for mood emoji
    console.log("[E2E] Test 3: Checking for mood emoji...");
    const moodEmoji = page.getByTestId("character-mood");
    await expect(moodEmoji).toBeVisible();
    const mood = await moodEmoji.textContent();
    console.log("[E2E] Test 3: ✓ Character mood:", mood);

    // Check for dialogue text
    console.log("[E2E] Test 3: Checking for dialogue text...");
    const dialogueText = page.locator(".dialogue-text");
    await expect(dialogueText).toBeVisible();
    const dialogue = await dialogueText.textContent();
    console.log(
      "[E2E] Test 3: ✓ Dialogue text (first 100 chars):",
      dialogue?.substring(0, 100)
    );
    expect(dialogue).toBeTruthy();
    expect(dialogue!.length).toBeGreaterThan(10);

    // Check for dialogue options
    console.log("[E2E] Test 3: Checking for dialogue options...");
    const dialogueOptions = page.getByTestId("dialogue-options");
    await expect(dialogueOptions).toBeVisible();

    const optionButtons = page.locator(".dialogue-option");
    const count = await optionButtons.count();
    console.log("[E2E] Test 3: ✓ Found", count, "dialogue options");
    expect(count).toBeGreaterThan(0);

    // Note: Location and time are now in LocationScene (base layer), not in the modal
    // Skip these checks as they're outside the modal context
    console.log(
      "[E2E] Test 3: ✓ Skipping location/time checks (in base layer)"
    );
  });

  test("should show stats sidebar during dialogue", async ({ page }) => {
    console.log("[E2E] Test 4: Loading page...");
    await page.goto("/?player=StatsTest");

    console.log("[E2E] Test 4: Skipping exposition...");
    await page.getByTestId("continue-button").click();

    console.log("[E2E] Test 4: Waiting for dialogue scene...");
    await expect(page.getByTestId("dialogue-scene")).toBeVisible({
      timeout: 30000,
    });

    console.log("[E2E] Test 4: Checking for stats...");

    // Check for morale
    await expect(page.getByText(/Morale:/i)).toBeVisible();
    console.log("[E2E] Test 4: ✓ Morale stat visible");

    // Check for stamina
    await expect(page.getByText(/Stamina:/i)).toBeVisible();
    console.log("[E2E] Test 4: ✓ Stamina stat visible");

    // Check for supplies
    await expect(page.getByText(/Supplies:/i)).toBeVisible();
    console.log("[E2E] Test 4: ✓ Supplies stat visible");

    // Check for progress info
    await expect(page.getByText(/Progress:/i)).toBeVisible();
    console.log("[E2E] Test 4: ✓ Progress counter visible");
  });

  test("should handle API errors gracefully", async ({ page }) => {
    console.log("[E2E] Test 5: Testing error handling...");

    // Block API requests to simulate error
    await page.route("**/api/dialogue/**", (route) => route.abort());

    await page.goto("/?player=ErrorTest");
    await page.getByTestId("continue-button").click();

    console.log("[E2E] Test 5: Waiting for error state...");

    // Should show error message
    const errorMessage = page.getByTestId("error-message");
    await expect(errorMessage).toBeVisible({ timeout: 30000 });
    console.log("[E2E] Test 5: ✓ Error message displayed");

    const errorText = await errorMessage.textContent();
    console.log("[E2E] Test 5: Error text:", errorText);
    expect(errorText).toBeTruthy();
  });

  test("should allow selecting dialogue options", async ({ page }) => {
    console.log("[E2E] Test 6: Testing dialogue option selection...");
    await page.goto("/?player=OptionTest");

    // Skip exposition
    await page.getByTestId("continue-button").click();

    // Wait for dialogue
    await expect(page.getByTestId("dialogue-scene")).toBeVisible({
      timeout: 30000,
    });

    // Wait for options to be enabled (not processing)
    console.log("[E2E] Test 6: Waiting for options to be enabled...");
    const firstOption = page.locator(".dialogue-option").first();
    await expect(firstOption).toBeEnabled({ timeout: 10000 });

    // Get the initial dialogue text
    const initialDialogue = await page.locator(".dialogue-text").textContent();
    console.log(
      "[E2E] Test 6: Initial dialogue (first 100 chars):",
      initialDialogue?.substring(0, 100)
    );

    // Click the first option
    console.log("[E2E] Test 6: Clicking first dialogue option...");
    await firstOption.click();

    // Wait for processing to start
    console.log("[E2E] Test 6: Waiting for processing state...");
    await page.waitForTimeout(500); // Brief wait for UI to update

    // Wait for new dialogue to appear (processing to end)
    console.log("[E2E] Test 6: Waiting for response...");
    await expect(firstOption).toBeEnabled({ timeout: 30000 });

    // Check if dialogue changed (or stayed same if it's the same character)
    const newDialogue = await page.locator(".dialogue-text").textContent();
    console.log(
      "[E2E] Test 6: New dialogue (first 100 chars):",
      newDialogue?.substring(0, 100)
    );

    // Just verify we got some dialogue response
    expect(newDialogue).toBeTruthy();
    expect(newDialogue!.length).toBeGreaterThan(10);
    console.log("[E2E] Test 6: ✓ Received dialogue response");
  });
});
