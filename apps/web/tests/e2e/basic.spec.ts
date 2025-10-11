import { expect, test } from "@playwright/test";

test.describe("Basic app functionality", () => {
  test("app loads and shows content", async ({ page }) => {
    console.log("[E2E] Testing basic app load...");

    // Capture console messages
    page.on("console", (msg) => {
      console.log("[Browser]", msg.type(), msg.text());
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

    await page.goto("/?player=BasicTest");

    // Wait a bit for API calls
    await page.waitForTimeout(5000);

    // Check if there's any content at all
    const body = await page.textContent("body");
    console.log("[E2E] Body content length:", body?.length);
    console.log("[E2E] Body first 200 chars:", body?.substring(0, 200));

    // Check for loading message or error
    const hasLoading = await page
      .getByText(/charting the river/i)
      .isVisible()
      .catch(() => false);
    const hasError = await page
      .locator(".error")
      .isVisible()
      .catch(() => false);
    const hasProse = await page
      .getByTestId("prose")
      .isVisible()
      .catch(() => false);

    console.log("[E2E] Has loading:", hasLoading);
    console.log("[E2E] Has error:", hasError);
    console.log("[E2E] Has prose:", hasProse);

    // If there's an error, get its text
    if (hasError) {
      const errorText = await page.locator(".error").textContent();
      console.log("[E2E] Error text:", errorText);
    }

    // App should show something (not be blank)
    expect(body?.length).toBeGreaterThan(0);
  });
});
