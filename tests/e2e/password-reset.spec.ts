import { test, expect, Page } from "@playwright/test";
import {
    generateTestUser,
    createTestUser,
    cleanupTestUserData,
    type TestUser
} from "./helpers/test-user";

const VALID_EMAIL = "user@example.com";
const VALID_PASSWORD = "newPassword123";
const SHORT_PASSWORD = "short";

async function disableNativeFormValidation(page: Page) {
    await page.evaluate(() => {
        const form = document.querySelector("form");
        if (form instanceof HTMLFormElement) {
            form.setAttribute("novalidate", "true");
        }
    });
}

test.describe("password reset", () => {
    test("forgot password page renders correctly", async ({ page }) => {
        await page.goto("/forgot-password");
        await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /send reset email/i })).toBeVisible();
    });

    test("shows validation error for invalid email", async ({ page }) => {
        await page.goto("/forgot-password");
        await page.getByLabel(/email/i).fill("invalid-email");
        await disableNativeFormValidation(page);
        await page.getByRole("button", { name: /send reset email/i }).click();
        await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    });

    test("shows success message after sending reset email", async ({ page }) => {
        // Skip this test as it requires email configuration
        test.skip();
    });

    test("can navigate back to sign in from forgot password", async ({ page }) => {
        await page.goto("/forgot-password");
        await page.getByRole("link", { name: /back to sign in/i }).click();
        await expect(page).toHaveURL(/sign-in/);
    });

    test("reset password page renders correctly", async ({ page }) => {
        await page.goto("/reset-password");
        await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
        await expect(page.getByLabel(/new password/i)).toBeVisible();
        await expect(page.getByLabel(/confirm password/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /reset password/i })).toBeVisible();
    });

    test("shows validation error for short password", async ({ page }) => {
        await page.goto("/reset-password");
        await page.getByLabel(/new password/i).fill(SHORT_PASSWORD);
        await page.getByLabel(/confirm password/i).fill(SHORT_PASSWORD);
        await page.getByRole("button", { name: /reset password/i }).click();
        await expect(page.getByText("Password must be at least 8 characters long")).toBeVisible();
    });

    test("shows error when passwords do not match", async ({ page }) => {
        await page.goto("/reset-password");
        await page.getByLabel(/new password/i).fill(VALID_PASSWORD);
        await page.getByLabel(/confirm password/i).fill("differentPassword123");
        await page.getByRole("button", { name: /reset password/i }).click();
        await expect(page.getByText("Passwords do not match")).toBeVisible();
    });

    test("redirects to sign in after successful password reset", async ({ page }) => {
        // 這個測試需要有效的重設 token，在真實環境中比較難以測試
        // 我們可以測試表單提交但跳過重定向驗證，或者 mock 這部分
        test.skip();

        // 如果要測試，需要：
        // 1. 先發送重設密碼郵件
        // 2. 從郵件中獲取重設 token
        // 3. 使用該 token 訪問重設密碼頁面
        // 4. 然後測試重設密碼流程
    });
});
