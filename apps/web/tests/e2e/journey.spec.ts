import { expect, test } from "@playwright/test";

const PLAYER_NAME = "TestExplorer";

test.describe("Hybrid journey system", () => {
  test("loads and progresses through dialogue and actions", async ({
    page,
  }) => {
    console.log("[E2E] Starting hybrid system test with player:", PLAYER_NAME);

    const gameUrl = `/?player=${encodeURIComponent(PLAYER_NAME)}`;

    // Add request/response logging
    page.on("request", (request) => {
      if (request.url().includes("/api/")) {
        console.log("[E2E] Request:", request.method(), request.url());
      }
    });

    page.on("response", (response) => {
      if (response.url().includes("/api/")) {
        console.log("[E2E] Response:", response.status(), response.url());
      }
    });

    // Navigate and wait for page load
    console.log("[E2E] Navigating to:", gameUrl);
    await page.goto(gameUrl, { waitUntil: "domcontentloaded" });
    console.log("[E2E] Page loaded");

    // Should show exposition scene initially
    console.log("[E2E] Checking for exposition...");
    const startButton = page.getByRole("button", { name: /begin/i });
    await expect(startButton).toBeVisible({ timeout: 10000 });

    // Set up waiters for dialogue start BEFORE clicking
    const dialogueStartPromise = page.waitForResponse(
      (res) => res.url().includes("/api/dialogue/start") && res.ok(),
      { timeout: 60000 } // Increased timeout for AI calls
    );

    console.log("[E2E] Clicking start button...");
    await startButton.click();

    // Wait for initial dialogue
    console.log(
      "[E2E] Waiting for /api/dialogue/start (AI call, may take up to 60s)..."
    );
    await dialogueStartPromise;
    console.log("[E2E] /api/dialogue/start completed");

    // Wait for dialogue modal to appear
    await page.waitForTimeout(2000);

    // Check for dialogue modal
    console.log("[E2E] Checking for dialogue modal...");
    const dialogueModal = page.getByRole("dialog");
    await expect(dialogueModal).toBeVisible({ timeout: 10000 });

    // Character name should be visible
    const characterName = page.locator(".character-name");
    await expect(characterName).toBeVisible();
    const nameText = await characterName.textContent();
    console.log("[E2E] Character name:", nameText);

    // Dialogue text should be visible
    const dialogueText = page.locator(".dialogue-text");
    await expect(dialogueText).toBeVisible();
    const dialogueContent = (await dialogueText.textContent())?.trim();
    expect(dialogueContent).toBeTruthy();
    expect(dialogueContent!.length).toBeGreaterThan(20);
    console.log("[E2E] Initial dialogue length:", dialogueContent!.length);

    // Stats sidebar should be visible
    console.log("[E2E] Checking stats sidebar...");
    await expect(page.getByText(/Morale:/i)).toBeVisible();
    await expect(page.getByText(/Stamina:/i)).toBeVisible();
    await expect(page.getByText(/Supplies:/i)).toBeVisible();
    await expect(page.getByText(/Progress:/i)).toBeVisible();

    // Dialogue options should be available
    console.log("[E2E] Checking dialogue options...");
    const dialogueOptions = page.locator(".dialogue-option");
    await expect(dialogueOptions.first()).toBeVisible({ timeout: 5000 });
    const optionCount = await dialogueOptions.count();
    console.log("[E2E] Found", optionCount, "dialogue options");
    expect(optionCount).toBeGreaterThanOrEqual(2);

    // Select a non-farewell option to continue dialogue
    console.log("[E2E] Selecting first dialogue option...");
    const dialogueContinuePromise = page.waitForResponse(
      (res) => res.url().includes("/api/dialogue/continue") && res.ok(),
      { timeout: 60000 }
    );

    await dialogueOptions.first().click();

    console.log(
      "[E2E] Waiting for /api/dialogue/continue (AI call, may take up to 60s)..."
    );
    await dialogueContinuePromise;
    console.log("[E2E] /api/dialogue/continue completed");

    await page.waitForTimeout(1500);

    // Check if dialogue modal is still visible (might have ended conversation)
    const dialogueStillOpen = await dialogueModal.isVisible();
    console.log("[E2E] Dialogue still open after continue:", dialogueStillOpen);

    if (dialogueStillOpen) {
      // Dialogue should update if conversation continues
      console.log("[E2E] Checking updated dialogue...");
      const updatedDialogueContent = (await dialogueText.textContent())?.trim();
      expect(updatedDialogueContent).toBeTruthy();
      console.log(
        "[E2E] Updated dialogue length:",
        updatedDialogueContent!.length
      );
    } else {
      console.log(
        "[E2E] Dialogue ended after first option, skipping dialogue update check"
      );
    }

    // If dialogue still open, look for farewell option
    if (dialogueStillOpen) {
      console.log("[E2E] Looking for farewell option...");
      const farewellOption = dialogueOptions.filter({
        hasText: /farewell|get going|continue|leave/i,
      });

      if ((await farewellOption.count()) > 0) {
        console.log("[E2E] Clicking farewell option...");
        const transitionPromise = page.waitForResponse(
          (res) =>
            res.url().includes("/api/modes/transition-from-dialogue") &&
            res.ok(),
          { timeout: 30000 }
        );

        await farewellOption.first().click();
        await transitionPromise;
        await page.waitForTimeout(1500);

        // Dialogue modal should close
        console.log("[E2E] Checking if dialogue modal closed...");
        await expect(dialogueModal).not.toBeVisible({ timeout: 5000 });
      } else {
        console.log(
          "[E2E] No farewell option found, dialogue may end automatically"
        );
      }
    }

    // Check if we're now in action mode
    console.log("[E2E] Checking post-dialogue state...");

    // Wait for modal to close if it hasn't already
    await page.waitForTimeout(1000);

    // Action menu bar should be visible (if in action mode)
    const actionMenuBar = page.locator(".action-menu-bar");
    if (await actionMenuBar.isVisible()) {
      console.log("[E2E] Action menu bar is visible");

      // Action categories should be present
      const actionCategories = page.locator(".action-category");
      const categoryCount = await actionCategories.count();
      console.log("[E2E] Found", categoryCount, "action categories");
      expect(categoryCount).toBeGreaterThan(0);
    } else {
      console.log(
        "[E2E] Action menu bar not visible - may still be in dialogue or another mode"
      );
    }

    // Location scene should always be visible
    const locationScene = page.locator(".location-scene");
    await expect(locationScene).toBeVisible();
    console.log("[E2E] Location scene is visible");

    console.log("[E2E] Hybrid system test completed successfully!");
  });

  test("handles loading states during dialogue", async ({ page }) => {
    console.log("[E2E] Testing loading states in hybrid system...");

    const gameUrl = `/?player=${encodeURIComponent(PLAYER_NAME)}`;

    await page.goto(gameUrl, { waitUntil: "domcontentloaded" });

    // Wait for exposition and click start
    const startButton = page.getByRole("button", { name: /begin/i });
    await expect(startButton).toBeVisible({ timeout: 10000 });

    const dialogueStartPromise = page.waitForResponse(
      (res) => res.url().includes("/api/dialogue/start") && res.ok(),
      { timeout: 60000 }
    );

    await startButton.click();
    await dialogueStartPromise;
    await page.waitForTimeout(2000);

    // Dialogue modal should be visible
    const dialogueModal = page.getByRole("dialog");
    await expect(dialogueModal).toBeVisible({ timeout: 10000 });

    // Dialogue options should be enabled (not in loading state)
    const dialogueOptions = page.locator(".dialogue-option");
    await expect(dialogueOptions.first()).toBeVisible();
    await expect(dialogueOptions.first()).toBeEnabled();

    console.log("[E2E] Loading states test completed!");
  });
});
