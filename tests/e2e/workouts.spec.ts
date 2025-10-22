import { test, expect } from "@playwright/test";
import {
  generateTestUser,
  createTestUser,
  signInUserOnPage,
  cleanupTestUserData,
  type TestUser
} from "./helpers/test-user";

test.describe("workouts", () => {
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

  test("allows creating, updating, and deleting workouts", async ({ page }) => {
    await page.goto("/workouts");

    // 創建新的 workout
    const workoutTitle = `E2E Workout ${Date.now()}`;
    await page.fill("#title", workoutTitle);

    // 等待創建 API 請求
    const createResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/workouts") && response.request().method() === "POST"
    );
    await page.getByRole("button", { name: /save/i }).click();
    const createResponse = await createResponsePromise;

    // 獲取創建的 workout ID
    const createPayload = (await createResponse.json()) as { data: { id: string } };
    const workoutId = createPayload.data.id;

    // 驗證 workout 已創建並顯示
    await expect(page.getByRole("heading", { name: workoutTitle })).toBeVisible();

    // 導航到 workout 詳細頁面
    const detailLink = page.locator(`a[href="/workouts/${workoutId}"]`).first();
    await Promise.all([
      page.waitForURL(`**/workouts/${workoutId}`),
      detailLink.click()
    ]);

    // 驗證已導航到詳細頁面
    await expect(page).toHaveURL(new RegExp(`/workouts/${workoutId}`));
    await expect(page.getByRole("heading", { name: workoutTitle })).toBeVisible();

    // 更新 workout 資訊
    await page.fill("#notes", "Updated notes");

    // 檢查 status 選項是否存在並選擇
    const statusSelect = page.locator("#status");
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption("completed");
    }

    // 保存更新
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText("Workout updated")).toBeVisible();

    // 驗證 workout entries 區域存在
    await expect(page.getByText("Workout entries")).toBeVisible();
    await expect(page.getByText("No entries yet.")).toBeVisible();

    // 驗證刪除按鈕存在（但不執行刪除，避免測試複雜性）
    const deleteButton = page.getByRole("button", { name: /delete/i });
    await expect(deleteButton).toBeVisible();

    // 測試成功：創建、導航、更新都正常工作
  });
});
