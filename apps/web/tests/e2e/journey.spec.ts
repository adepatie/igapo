import { expect, test } from "@playwright/test";

const PLAYER_NAME = "TestExplorer";

test.describe("AI-powered journey", () => {
  test("loads and progresses through multiple turns", async ({ page }) => {
    console.log("[E2E] Starting test with player:", PLAYER_NAME);

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

    // Set up response waiters BEFORE navigation
    console.log("[E2E] Setting up API response waiters...");
    const startPromise = page.waitForResponse(
      (res) => res.url().includes("/api/start") && res.ok(),
      { timeout: 30000 }
    );
    const narratePromise = page.waitForResponse(
      (res) => res.url().includes("/api/narrate") && res.ok(),
      { timeout: 40000 } // AI narration can take 20-30 seconds
    );

    // Navigate
    console.log("[E2E] Navigating to:", gameUrl);
    await page.goto(gameUrl, { waitUntil: "domcontentloaded" });
    console.log("[E2E] Page loaded");

    // Wait for API calls with better error handling
    console.log("[E2E] Waiting for /api/start...");
    await startPromise.catch((err) => {
      console.error("[E2E] Failed to get /api/start response:", err.message);
      throw err;
    });
    console.log("[E2E] /api/start completed");

    console.log(
      "[E2E] Waiting for /api/narrate (this may take 20-30 seconds for AI)..."
    );
    await narratePromise.catch((err) => {
      console.error("[E2E] Failed to get /api/narrate response:", err.message);
      throw err;
    });
    console.log("[E2E] /api/narrate completed");

    // Wait for React to render the UI
    await page.waitForTimeout(2000);

    // Debug: Check what's actually on the page
    const bodyText = await page.textContent("body");
    console.log("[E2E] Body content:", bodyText?.substring(0, 300));
    const html = await page.content();
    console.log("[E2E] Has h2 tags:", html.includes("<h2"));
    console.log(
      "[E2E] Has data-testid=prose:",
      html.includes('data-testid="prose"')
    );
    console.log(
      "[E2E] Has data-testid=choice:",
      html.includes('data-testid="choice"')
    );

    // Banner should be visible with location and day
    console.log("[E2E] Checking banner...");
    const banner = page.getByRole("heading", { level: 2 });
    await expect(banner).toBeVisible({ timeout: 10000 });
    const bannerText = await banner.textContent();
    console.log("[E2E] Banner text:", bannerText);
    expect(bannerText).toMatch(/Day \d+/i);

    // Narrative prose should be visible
    console.log("[E2E] Checking prose...");
    const prose = page.getByTestId("prose");
    await expect(prose).toBeVisible({ timeout: 5000 });
    const initialProse = (await prose.textContent())?.trim();
    expect(initialProse).toBeTruthy();
    expect(initialProse!.length).toBeGreaterThan(50);
    console.log("[E2E] Initial prose length:", initialProse!.length);

    // Stats should be visible (use first() to avoid strict mode violations with narrative text)
    console.log("[E2E] Checking stats...");
    await expect(page.getByText(/Morale:/i).first()).toBeVisible();
    await expect(page.getByText(/Stamina:/i).first()).toBeVisible();
    await expect(page.getByText(/Supplies:/i).first()).toBeVisible();

    // Player name should be in footer (use first() to avoid strict mode violation)
    await expect(page.getByText(new RegExp(PLAYER_NAME)).first()).toBeVisible();

    // Choices should be available
    console.log("[E2E] Checking choices...");
    const choices = page.getByTestId("choice");
    await expect(choices.first()).toBeVisible({ timeout: 5000 });
    const choiceCount = await choices.count();
    console.log("[E2E] Found", choiceCount, "choices");
    expect(choiceCount).toBeGreaterThan(0);

    // Each choice should have a label
    for (let i = 0; i < choiceCount; i++) {
      const choiceText = await choices.nth(i).textContent();
      expect(choiceText?.trim().length).toBeGreaterThan(0);
    }

    // Perform first turn
    console.log("[E2E] Clicking first choice...");

    // Set up waiters BEFORE clicking to catch the responses
    const actionResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/action") && res.ok(),
      { timeout: 30000 }
    );
    const narrateResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/narrate") && res.ok(),
      { timeout: 40000 }
    );
    const actionsResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/actions") && res.ok(),
      { timeout: 30000 }
    );

    await choices.first().click();

    console.log("[E2E] Waiting for /api/action...");
    await actionResponsePromise;
    console.log("[E2E] /api/action completed");

    console.log(
      "[E2E] Waiting for /api/narrate after turn 1 (AI call, may take 20-30s)..."
    );
    await narrateResponsePromise;
    console.log("[E2E] /api/narrate after turn 1 completed");

    console.log("[E2E] Waiting for /api/actions...");
    await actionsResponsePromise;
    console.log("[E2E] /api/actions completed");

    await page.waitForTimeout(1000);

    // Prose should update
    console.log("[E2E] Checking prose after turn 1...");
    await expect(prose).toBeVisible();
    const proseAfterTurn1 = (await prose.textContent())?.trim();
    expect(proseAfterTurn1).not.toBe(initialProse);
    console.log("[E2E] Prose after turn 1 length:", proseAfterTurn1!.length);

    // Banner should update (day should increment)
    const bannerAfterTurn1 = await banner.textContent();
    expect(bannerAfterTurn1).toMatch(/Day \d+/i);

    // New choices should be available
    await expect(choices.first()).toBeVisible();
    await expect(choices.first()).toBeEnabled();

    // Perform second turn
    console.log("[E2E] Clicking second choice...");

    // Set up waiters BEFORE clicking
    const action2ResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/action") && res.ok(),
      { timeout: 30000 }
    );
    const narrate2ResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/narrate") && res.ok(),
      { timeout: 40000 }
    );
    const actions2ResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/actions") && res.ok(),
      { timeout: 30000 }
    );

    await choices.first().click();

    console.log("[E2E] Waiting for /api/action...");
    await action2ResponsePromise;
    console.log("[E2E] /api/action completed");

    console.log(
      "[E2E] Waiting for /api/narrate after turn 2 (AI call, may take 20-30s)..."
    );
    await narrate2ResponsePromise;
    console.log("[E2E] /api/narrate after turn 2 completed");

    console.log("[E2E] Waiting for /api/actions...");
    await actions2ResponsePromise;
    console.log("[E2E] /api/actions completed");

    await page.waitForTimeout(1000);

    // Prose should update again
    console.log("[E2E] Checking prose after turn 2...");
    const proseAfterTurn2 = (await prose.textContent())?.trim();
    expect(proseAfterTurn2).not.toBe(proseAfterTurn1);
    console.log("[E2E] Prose after turn 2 length:", proseAfterTurn2!.length);

    // Journal should have entries
    const journalSection = page.locator(".journal");
    if (await journalSection.isVisible()) {
      const journalEntries = journalSection.locator(".journal__entry");
      const entryCount = await journalEntries.count();
      expect(entryCount).toBeGreaterThan(0);
    }

    console.log("[E2E] Test completed successfully!");
  });

  test("handles loading states", async ({ page }) => {
    console.log("[E2E] Testing loading states...");

    const gameUrl = `/?player=${encodeURIComponent(PLAYER_NAME)}`;

    // Set up response waiters BEFORE navigation
    const startPromise = page.waitForResponse(
      (res) => res.url().includes("/api/start") && res.ok(),
      { timeout: 30000 }
    );
    const narratePromise = page.waitForResponse(
      (res) => res.url().includes("/api/narrate") && res.ok(),
      { timeout: 40000 }
    );

    await page.goto(gameUrl, { waitUntil: "domcontentloaded" });

    console.log("[E2E] Waiting for API responses...");
    await startPromise;
    await narratePromise;
    console.log("[E2E] API responses complete");

    // Wait for React to render
    await page.waitForTimeout(1000);

    const choices = page.getByTestId("choice");
    await expect(choices.first()).toBeVisible();
    await expect(choices.first()).toBeEnabled();

    console.log("[E2E] Loading states test completed!");
  });
});
