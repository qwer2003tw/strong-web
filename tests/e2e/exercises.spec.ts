import { test, expect } from "@playwright/test";
import {
  generateTestUser,
  createTestUser,
  signInUserOnPage,
  cleanupTestUserData,
  type TestUser
} from "./helpers/test-user";

test.describe("exercises", () => {
  let testUser: TestUser;

  test.beforeEach(async ({ page }) => {
    // 創建測試用戶
    testUser = generateTestUser();
    testUser = await createTestUser(testUser);

    // 登入測試用戶
    await signInUserOnPage(page, testUser);
  });

  test.afterEach(async () => {
    // 清理測試用戶數據
    if (testUser?.id) {
      await cleanupTestUserData(testUser);
    }
  });

  test("authenticated user can create an exercise", async ({ page }) => {
    await page.goto("/exercises");
    await expect(page).toHaveURL(/\/exercises$/);

    // 檢查頁面基本元素是否存在
    await expect(page.getByLabel("Name")).toBeVisible();

    // 填寫新運動表單
    await page.fill("#name", "Front Squat");
    await page.fill("#muscle_group", "Quads");
    await page.fill("#equipment", "Barbell");
    await page.fill("#notes", "Keep torso upright");

    // 等待 API 請求
    const responsePromise = page.waitForResponse((response) => {
      return response.url().includes("/api/exercises") && response.request().method() === "POST";
    });

    // 點擊保存按鈕
    await page.getByRole("button", { name: /save exercise/i }).click();
    await responsePromise;

    // 驗證新運動已創建並顯示
    const newCard = page.locator("div.rounded-lg").filter({
      has: page.getByRole("heading", { name: "Front Squat" }),
    });

    await expect(newCard).toHaveCount(1);
    const cardContent = newCard.first();

    await expect(cardContent).toContainText("Muscle group: Quads");
    await expect(cardContent).toContainText("Equipment: Barbell");
    await expect(cardContent).toContainText("Keep torso upright");
    await expect(cardContent).toContainText("Updated");
  });
});
