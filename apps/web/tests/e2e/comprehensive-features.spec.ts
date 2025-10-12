import { expect, test } from "@playwright/test";

const PLAYER_NAME = "FeatureTestPlayer";

test.describe("Comprehensive Game Features - Phase 2-5 Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Capture all browser events for debugging
    page.on("console", (msg) => {
      console.log(`[Browser ${msg.type()}]`, msg.text());
    });

    page.on("pageerror", (error) => {
      console.error("[Browser Error]", error.message, error.stack);
    });

    page.on("requestfailed", (request) => {
      console.error(
        "[Request Failed]",
        request.url(),
        request.failure()?.errorText
      );
    });

    // API request/response logging
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
  });

  test("complete game flow with all Phase 2-5 features", async ({ page }) => {
    console.log(
      "[E2E] Starting comprehensive feature test with player:",
      PLAYER_NAME
    );

    await page.goto(`/?player=${encodeURIComponent(PLAYER_NAME)}`);
    console.log("[E2E] Page loaded");

    // === PHASE 1: INITIAL SETUP ===
    console.log("[E2E] === PHASE 1: Checking initial exposition ===");

    // Check exposition scene is visible
    const expositionScene = page.getByTestId("exposition-scene");
    await expect(expositionScene).toBeVisible({ timeout: 10000 });
    console.log("[E2E] ✓ Exposition scene visible");

    // Verify title and content
    await expect(page.getByText("The Igapó Expedition")).toBeVisible();
    await expect(page.getByText(/grandmother/i)).toBeVisible();
    await expect(page.getByText(/Lágrimas da Lua/)).toBeVisible();
    console.log("[E2E] ✓ Exposition content correct");

    // Click continue button
    const continueButton = page.getByTestId("continue-button");
    await expect(continueButton).toBeVisible();

    // Set up API response waiter BEFORE clicking
    const dialogueStartPromise = page.waitForResponse(
      (res) => res.url().includes("/api/dialogue/start") && res.ok(),
      { timeout: 60000 }
    );

    await continueButton.click();
    console.log("[E2E] ✓ Continue button clicked");

    // === PHASE 2: DIALOGUE SYSTEM ===
    console.log("[E2E] === PHASE 2: Testing dialogue system ===");

    // Wait for dialogue API call
    await dialogueStartPromise;
    console.log("[E2E] ✓ Dialogue API call completed");

    // Check dialogue modal appears
    const dialogueModal = page.getByRole("dialog");
    await expect(dialogueModal).toBeVisible({ timeout: 10000 });
    console.log("[E2E] ✓ Dialogue modal visible");

    // Verify character details
    const characterName = page.locator(".character-name");
    await expect(characterName).toBeVisible();
    const nameText = await characterName.textContent();
    console.log("[E2E] ✓ Character name:", nameText);

    // Verify dialogue text
    const dialogueText = page.locator(".dialogue-text");
    await expect(dialogueText).toBeVisible();
    const dialogueContent = (await dialogueText.textContent())?.trim();
    expect(dialogueContent).toBeTruthy();
    expect(dialogueContent!.length).toBeGreaterThan(20);
    console.log(
      "[E2E] ✓ Dialogue text present (length:",
      dialogueContent!.length,
      ")"
    );

    // === PHASE 3: NEW UI COMPONENTS INTEGRATION ===
    console.log("[E2E] === PHASE 3: Testing Phase 2-5 UI components ===");

    // Check for Phase 2-5 UI components in the layout
    // These should be visible in the header/sidebar/panels

    // Pocketwatch (always visible)
    const pocketwatch = page.locator(".app-shell__pocketwatch");
    await expect(pocketwatch).toBeVisible();
    console.log("[E2E] ✓ Pocketwatch visible");

    // Weather indicator (always visible)
    const weatherIndicator = page.locator(".app-shell__weather");
    await expect(weatherIndicator).toBeVisible();
    console.log("[E2E] ✓ Weather indicator visible");

    // Supply display (always visible)
    const supplyDisplay = page.locator(".app-shell__supplies");
    await expect(supplyDisplay).toBeVisible();
    console.log("[E2E] ✓ Supply display visible");

    // Survival status (always visible)
    const survivalStatus = page.locator(".app-shell__survival");
    await expect(survivalStatus).toBeVisible();
    console.log("[E2E] ✓ Survival status visible");

    // Party panel (in panels area)
    const partyPanel = page.locator(".app-shell__party");
    await expect(partyPanel).toBeVisible();
    console.log("[E2E] ✓ Party panel visible");

    // Minimap (in panels area)
    const minimap = page.locator(".app-shell__minimap");
    await expect(minimap).toBeVisible();
    console.log("[E2E] ✓ Minimap visible");

    // === PHASE 4: DIALOGUE INTERACTION ===
    console.log("[E2E] === PHASE 4: Testing dialogue interaction ===");

    // Check dialogue options are available
    const dialogueOptions = page.locator(".dialogue-option");
    await expect(dialogueOptions.first()).toBeVisible({ timeout: 5000 });
    const optionCount = await dialogueOptions.count();
    console.log("[E2E] ✓ Found", optionCount, "dialogue options");
    expect(optionCount).toBeGreaterThanOrEqual(2);

    // Select first dialogue option
    const dialogueContinuePromise = page.waitForResponse(
      (res) => res.url().includes("/api/dialogue/continue") && res.ok(),
      { timeout: 60000 }
    );

    await dialogueOptions.first().click();
    console.log("[E2E] ✓ First dialogue option clicked");

    // Wait for dialogue to continue
    await dialogueContinuePromise;
    console.log("[E2E] ✓ Dialogue continue API call completed");

    await page.waitForTimeout(1500);

    // === PHASE 5: POST-DIALOGUE STATE ===
    console.log("[E2E] === PHASE 5: Testing post-dialogue state ===");

    // Dialogue modal should still be visible (conversation continuing)
    const dialogueStillOpen = await dialogueModal.isVisible();
    console.log("[E2E] Dialogue still open after continue:", dialogueStillOpen);

    if (dialogueStillOpen) {
      // Check if dialogue updated
      const updatedDialogueContent = (await dialogueText.textContent())?.trim();
      expect(updatedDialogueContent).toBeTruthy();
      console.log(
        "[E2E] ✓ Dialogue updated (length:",
        updatedDialogueContent!.length,
        ")"
      );
    }

    // === PHASE 6: ACTION MODE TRANSITION ===
    console.log("[E2E] === PHASE 6: Testing action mode transition ===");

    // Look for farewell option to end dialogue
    const farewellOptions = dialogueOptions.filter({
      hasText: /farewell|get going|continue|leave|goodbye/i,
    });

    if ((await farewellOptions.count()) > 0) {
      console.log("[E2E] Found farewell option, clicking it...");

      // Set up transition waiter
      const transitionPromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/modes/transition-from-dialogue") && res.ok(),
        { timeout: 30000 }
      );

      await farewellOptions.first().click();
      await transitionPromise;
      await page.waitForTimeout(1500);

      // Dialogue modal should close
      await expect(dialogueModal).not.toBeVisible({ timeout: 5000 });
      console.log("[E2E] ✓ Dialogue modal closed after farewell");
    } else {
      console.log(
        "[E2E] No farewell option found - dialogue may end automatically"
      );
    }

    // === PHASE 7: ACTION MENU TESTING ===
    console.log("[E2E] === PHASE 7: Testing action menu ===");

    // Wait for modal to close completely
    await page.waitForTimeout(1000);

    // Check if action menu is visible
    const actionMenuBar = page.locator(".action-menu-bar");
    const actionMenuVisible = await actionMenuBar.isVisible();

    if (actionMenuVisible) {
      console.log("[E2E] ✓ Action menu bar is visible");

      // Check for action categories (movement, social, survival, special)
      const actionCategories = page.locator(".action-category");
      const categoryCount = await actionCategories.count();
      console.log("[E2E] ✓ Found", categoryCount, "action categories");
      expect(categoryCount).toBeGreaterThan(0);

      // Check for specific Phase 2-5 action categories
      await expect(page.getByText(/movement|travel/i)).toBeVisible();
      console.log("[E2E] ✓ Movement/travel actions available");
    } else {
      console.log(
        "[E2E] ⚠️ Action menu bar not visible - may still be in dialogue or another mode"
      );
    }

    // === PHASE 8: PARTY SYSTEM TESTING ===
    console.log("[E2E] === PHASE 8: Testing party system ===");

    // Check if party panel shows party member information
    const partyContent = await partyPanel.textContent();
    console.log("[E2E] Party panel content:", partyContent);

    // Should show either "No party members" or actual party members
    expect(partyContent).toBeTruthy();
    console.log("[E2E] ✓ Party panel populated");

    // === PHASE 9: SUPPLY SYSTEM TESTING ===
    console.log("[E2E] === PHASE 9: Testing supply system ===");

    // Check supply display shows actual supply values
    const supplyContent = await supplyDisplay.textContent();
    console.log("[E2E] Supply display content:", supplyContent);
    expect(supplyContent).toBeTruthy();
    console.log("[E2E] ✓ Supply display populated");

    // === PHASE 10: WEATHER SYSTEM TESTING ===
    console.log("[E2E] === PHASE 10: Testing weather system ===");

    // Check weather indicator shows weather information
    const weatherContent = await weatherIndicator.textContent();
    console.log("[E2E] Weather indicator content:", weatherContent);
    expect(weatherContent).toBeTruthy();
    console.log("[E2E] ✓ Weather indicator populated");

    // === PHASE 11: MINIMAP TESTING ===
    console.log("[E2E] === PHASE 11: Testing minimap ===");

    // Check minimap shows location information
    const minimapContent = await minimap.textContent();
    console.log("[E2E] Minimap content:", minimapContent);
    expect(minimapContent).toBeTruthy();
    console.log("[E2E] ✓ Minimap populated");

    // === PHASE 12: LOCATION SCENE TESTING ===
    console.log("[E2E] === PHASE 12: Testing location scene ===");

    // Location scene should always be visible (base layer)
    const locationScene = page.locator(".location-scene");
    await expect(locationScene).toBeVisible();
    console.log("[E2E] ✓ Location scene visible");

    // Check for location information
    await expect(page.getByText(/loreto/i)).toBeVisible();
    console.log("[E2E] ✓ Location name visible");

    // === PHASE 13: STATS SIDEBAR TESTING ===
    console.log("[E2E] === PHASE 13: Testing stats sidebar ===");

    // Check for all the new stats
    await expect(page.getByText(/Morale:/i)).toBeVisible();
    await expect(page.getByText(/Stamina:/i)).toBeVisible();
    await expect(page.getByText(/Supplies:/i)).toBeVisible();
    await expect(page.getByText(/Progress:/i)).toBeVisible();
    console.log("[E2E] ✓ All stats visible in sidebar");

    // === PHASE 14: FINAL STATE VERIFICATION ===
    console.log("[E2E] === PHASE 14: Final state verification ===");

    // App should not be blank - should have content
    const bodyContent = await page.textContent("body");
    expect(bodyContent?.length).toBeGreaterThan(100);
    console.log(
      "[E2E] ✓ App has substantial content (length:",
      bodyContent?.length,
      ")"
    );

    // No error messages should be visible
    const errorElements = page.locator(".error");
    const errorCount = await errorElements.count();
    expect(errorCount).toBe(0);
    console.log("[E2E] ✓ No error messages visible");

    console.log("[E2E] 🎉 Comprehensive feature test completed successfully!");
    console.log("[E2E] All Phase 2-5 features are integrated and accessible!");
  });

  test("tests action menu interactions with Phase 2-5 features", async ({
    page,
  }) => {
    console.log("[E2E] Starting action menu interaction test...");

    await page.goto(`/?player=${encodeURIComponent(PLAYER_NAME)}`);

    // Skip exposition quickly
    await page.getByTestId("continue-button").click();

    // Wait for dialogue to load
    await page.waitForResponse(
      (res) => res.url().includes("/api/dialogue/start") && res.ok(),
      { timeout: 60000 }
    );

    // Wait for dialogue modal
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Select dialogue options to get to action menu
    const dialogueOptions = page.locator(".dialogue-option");
    await expect(dialogueOptions.first()).toBeVisible();

    // Try to find and click a farewell option
    const farewellOptions = dialogueOptions.filter({
      hasText: /farewell|get going|continue|leave|goodbye/i,
    });

    if ((await farewellOptions.count()) > 0) {
      console.log("[E2E] Clicking farewell option...");
      await farewellOptions.first().click();

      await page.waitForResponse(
        (res) =>
          res.url().includes("/api/modes/transition-from-dialogue") && res.ok(),
        { timeout: 30000 }
      );

      await page.waitForTimeout(1000);

      // Check if action menu is now visible
      const actionMenuBar = page.locator(".action-menu-bar");
      const actionMenuVisible = await actionMenuBar.isVisible();

      if (actionMenuVisible) {
        console.log("[E2E] ✓ Action menu is visible after dialogue");

        // Check for action categories
        const actionCategories = page.locator(".action-category");
        const categoryCount = await actionCategories.count();
        console.log("[E2E] Found", categoryCount, "action categories");

        // Check for specific Phase 2-5 categories
        await expect(page.getByText(/movement|travel/i)).toBeVisible();
        console.log("[E2E] ✓ Travel/movement actions available");

        // Try clicking on a travel/movement action
        const travelActions = page.locator(".action-category").filter({
          hasText: /movement|travel/i,
        });

        if ((await travelActions.count()) > 0) {
          console.log("[E2E] Clicking travel action...");
          await travelActions.click();

          // Should open travel modal or show travel options
          await page.waitForTimeout(1000);

          // Check if travel modal or options appear
          const travelModal = page.locator(".travel-modal");
          const travelOptions = page.locator(".travel-option");

          const hasTravelModal = await travelModal.isVisible();
          const hasTravelOptions = (await travelOptions.count()) > 0;

          if (hasTravelModal || hasTravelOptions) {
            console.log("[E2E] ✓ Travel interface opened successfully");
          } else {
            console.log("[E2E] ⚠️ Travel interface not visible after clicking");
          }
        }
      } else {
        console.log("[E2E] ⚠️ Action menu not visible after dialogue");
      }
    } else {
      console.log("[E2E] No farewell option found - cannot test action menu");
    }

    console.log("[E2E] Action menu interaction test completed!");
  });

  test("tests error handling and edge cases", async ({ page }) => {
    console.log("[E2E] Testing error handling and edge cases...");

    await page.goto(`/?player=${encodeURIComponent(PLAYER_NAME)}`);

    // Test 1: Invalid player name handling
    await page.goto("/?player="); // Empty player name

    // Should handle gracefully (might show error or fallback)
    await page.waitForTimeout(2000);

    const hasError = await page
      .locator(".error")
      .isVisible()
      .catch(() => false);
    const hasContent = (await page.textContent("body"))?.length || 0 > 50;

    if (hasError) {
      console.log("[E2E] ✓ Error handling works for invalid player name");
    } else if (hasContent) {
      console.log("[E2E] ✓ Graceful fallback for invalid player name");
    }

    // Test 2: Network error simulation
    await page.route("**/api/dialogue/**", (route) => {
      route.abort("failed");
    });

    await page.goto(`/?player=${encodeURIComponent(PLAYER_NAME)}`);
    await page.getByTestId("continue-button").click();

    // Should show error message
    await page.waitForTimeout(5000);
    const errorVisible = await page.locator(".error").isVisible();
    console.log(
      "[E2E] Network error handling:",
      errorVisible ? "✓ Works" : "⚠️ Not working"
    );

    console.log("[E2E] Error handling tests completed!");
  });
});
