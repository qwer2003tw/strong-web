import { test, expect } from "@playwright/test";

test.describe("workouts", () => {
  test("unauthenticated users are redirected to sign-in", async ({ page }) => {
    await page.goto("/workouts");
    await expect(page).toHaveURL(/sign-in/);
  });
});
