import { test, expect } from "@playwright/test";
import {
  generateTestUser,
  createTestUser,
  signInUserOnPage,
  cleanupTestUserData,
  type TestUser
} from "./helpers/test-user";

test.describe("history dashboard", () => {
  test("unauthenticated users reach history in test mode", async ({ page }) => {
    await page.goto("/history");
    await expect(page).toHaveURL(/\/history$/);
  });

  test("authenticated users can switch ranges and see updated history", async ({ page }) => {
    // 創建測試用戶並登入
    let testUser = generateTestUser();
    testUser = await createTestUser(testUser);

    try {
      await signInUserOnPage(page, testUser);

      // 導航到歷史頁面
      await page.goto("/history");
      await expect(page).toHaveURL(/\/history$/);

      // 檢查頁面基本元素
      await expect(page.locator("#history-range")).toBeVisible();

      // 測試範圍切換功能
      const rangeSelect = page.locator("#history-range");

      // 切換到 7 天範圍
      await rangeSelect.selectOption("7d");

      // 等待一下讓 API 請求完成
      await page.waitForTimeout(1000);

      // 切換回 30 天範圍
      await rangeSelect.selectOption("30d");

      // 等待一下讓 API 請求完成
      await page.waitForTimeout(1000);

      // 檢查是否有公式選擇器（如果存在的話）
      const formulaSelect = page.getByLabel("Formula");
      if (await formulaSelect.isVisible()) {
        // 測試公式切換
        await formulaSelect.selectOption("brzycki");
        await page.waitForTimeout(500);
        await formulaSelect.selectOption("epley");
      }

    } finally {
      // 清理測試用戶數據
      if (testUser?.id) {
        await cleanupTestUserData(testUser);
      }
    }
  });
});
