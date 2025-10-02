import { test, expect, Page } from "@playwright/test";

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
        await page.goto("/forgot-password");
        await page.getByLabel(/email/i).fill(VALID_EMAIL);
        await page.getByRole("button", { name: /send reset email/i }).click();

        // Wait for success state
        await expect(page.getByRole("heading", { name: /check.*email/i })).toBeVisible();
        await expect(page.getByText(/sent.*email.*instructions/i)).toBeVisible();
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
        await page.goto("/reset-password");
        await page.getByLabel(/new password/i).fill(VALID_PASSWORD);
        await page.getByLabel(/confirm password/i).fill(VALID_PASSWORD);
        await page.getByRole("button", { name: /reset password/i }).click();

        // Should redirect to sign in with success parameter
        await expect(page).toHaveURL(/sign-in.*reset=success/);
    });
});
