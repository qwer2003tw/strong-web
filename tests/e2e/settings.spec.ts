import { test, expect } from "@playwright/test";

test.describe("settings preferences", () => {
  test.beforeEach(async ({ request }) => {
    await request.delete("/api/test-utils/mock-supabase");
    await request.post("/api/test-utils/mock-supabase", {
      data: {
        userId: "user-settings",
        profile: {
          id: "user-settings",
          full_name: "Playwright User",
          locale: "en",
          unit_preference: "metric",
          theme_preference: "system",
        },
      },
    });
  });

  test.afterEach(async ({ request }) => {
    await request.delete("/api/test-utils/mock-supabase");
  });

  test("allows updating preferences and persists after refresh", async ({ page }) => {
    await page.goto("/settings");

    const saveButton = page.getByRole("button", { name: "Save settings" });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();

    await page.getByLabel("Preferred unit").selectOption("imperial");
    await page.getByLabel("Theme").selectOption("dark");

    await saveButton.click();

    await expect(page.getByText("Settings updated")).toBeVisible({ timeout: 5000 });
    await page.reload();

    await expect(page.getByLabel("Preferred unit")).toHaveValue("imperial");
    await expect(page.getByLabel("Theme")).toHaveValue("dark");
  });
});
