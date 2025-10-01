import { test, expect } from '@playwright/test';

test('home page renders placeholder content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Strong Web');
  await expect(page.locator('p')).toHaveText('Minimal placeholder server for Playwright tests.');
});
