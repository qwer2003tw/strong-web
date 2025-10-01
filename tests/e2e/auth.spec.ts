import { test, expect } from "@playwright/test";

test.describe("authentication", () => {
  test("sign-in page renders", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("can navigate to sign-up", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: /create account/i }).click();
    await expect(page).toHaveURL(/sign-up/);
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
  });
});
