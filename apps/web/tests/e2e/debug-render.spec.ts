import { expect, test } from "@playwright/test";

test.describe("Basic Rendering Debug", () => {
  test("check what actually renders", async ({ page }) => {
    // Capture everything
    page.on("console", (msg) => {
      console.log(`[Browser ${msg.type()}]`, msg.text());
    });

    page.on("pageerror", (error) => {
      console.error("[Browser Error]", error.message, error.stack);
    });

    await page.goto("/?player=DebugTest");

    // Wait a bit for render
    await page.waitForTimeout(2000);

    // Get the entire HTML
    const html = await page.content();
    console.log("\n========== FULL PAGE HTML ==========");
    console.log(html);
    console.log("====================================\n");

    // Get body text
    const bodyText = await page.textContent("body");
    console.log("\n========== BODY TEXT ==========");
    console.log(bodyText);
    console.log("================================\n");

    // Check for specific elements
    const hasExposition = await page
      .locator('[data-testid="exposition-scene"]')
      .count();
    console.log("[DEBUG] Exposition scene count:", hasExposition);

    const hasDialogue = await page
      .locator('[data-testid="dialogue-scene"]')
      .count();
    console.log("[DEBUG] Dialogue scene count:", hasDialogue);

    const allTestIds = await page.locator("[data-testid]").all();
    console.log("[DEBUG] All elements with test IDs:", allTestIds.length);
    for (const element of allTestIds) {
      const testId = await element.getAttribute("data-testid");
      console.log(`  - ${testId}`);
    }

    // Check for any error messages
    const errors = await page.locator('.error, [role="alert"]').all();
    console.log("[DEBUG] Error elements:", errors.length);
    for (const error of errors) {
      const errorText = await error.textContent();
      console.log(`  - Error: ${errorText}`);
    }
  });
});
