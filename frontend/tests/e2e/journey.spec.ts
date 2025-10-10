import { expect, test } from "@playwright/test";

const SEED = "playwright-e2e";

test("seeded journey flows", async ({ page }) => {
  await page.goto(`/?seed=${SEED}`);

  await expect(page.getByRole("heading", { level: 2 })).toBeVisible();

  const buttons = page.getByRole("button");
  await expect(buttons.first()).toBeVisible();

  const firstChoice = buttons.first();
  await firstChoice.click();

  await expect(buttons.first()).toBeVisible();
  await expect(page.getByText(/Seed:/)).toContainText(SEED);
});
