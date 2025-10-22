import { test, expect } from "@playwright/test";
import {
  generateTestUser,
  createTestUser,
  signInUserOnPage,
  cleanupTestUserData,
  type TestUser
} from "./helpers/test-user";

test.describe("settings preferences", () => {
  let testUser: TestUser;

  test.beforeEach(async ({ page }) => {
    // 創建測試用戶並登入
    testUser = generateTestUser();
    testUser = await createTestUser(testUser);
    await signInUserOnPage(page, testUser);
  });

  test.afterEach(async () => {
    // 清理測試用戶數據
    if (testUser?.id) {
      await cleanupTestUserData(testUser);
    }
  });

  test("allows updating preferences and persists after refresh", async ({ page }) => {
    await page.goto("/settings");

    // 等待頁面載入並檢查保存按鈕
    const saveButton = page.getByRole("button", { name: "Save settings" });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();

    // 更改設定
    await page.getByLabel("Preferred unit").selectOption("imperial");
    await page.getByLabel("Theme").selectOption("dark");

    // 保存設定
    await saveButton.click();

    // 等待成功訊息
    await expect(page.getByText("Settings updated")).toBeVisible({ timeout: 5000 });

    // 重新載入頁面以測試持久化
    await page.reload();

    // 等待頁面重新載入後檢查設定是否保持
    await expect(page.getByLabel("Preferred unit")).toHaveValue("imperial");
    await expect(page.getByLabel("Theme")).toHaveValue("dark");
  });
});
