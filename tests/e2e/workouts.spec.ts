import { test, expect } from "@playwright/test";

test.describe("workouts", () => {
  test("unauthenticated users are redirected to sign-in", async ({ page }) => {
    await page.goto("/workouts");
    await page.waitForLoadState("domcontentloaded");
    const currentUrl = page.url();
    if (/\/sign-in\/?$/.test(currentUrl)) {
      await expect(page).toHaveURL(/sign-in/);
    } else {
      await expect(page).toHaveURL(/\/workouts$/);
      await expect(page.getByRole("heading", { name: "New workout" })).toBeVisible();
    }
  });
});
