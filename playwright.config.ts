import { defineConfig } from '@playwright/test';

const PORT = 3000;
const HOSTNAME = '127.0.0.1';
const BASE_URL = `http://${HOSTNAME}:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: process.env.CI
      ? `pnpm start -- --hostname ${HOSTNAME} --port ${PORT}`
      : `pnpm dev -- --hostname ${HOSTNAME} --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
