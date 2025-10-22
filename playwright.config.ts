import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000, // 恢復合理的測試超時
  expect: {
    timeout: 5_000, // 恢復合理的期望超時
  },
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    headless: true,
    navigationTimeout: 30000, // 恢復合理的導航超時
    actionTimeout: 15000, // 恢復合理的動作超時
  },
  webServer: {
    command: process.env.CI
      ? "pnpm next start --hostname 127.0.0.1 --port 3000"
      : "pnpm dev --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://rmrrewoywkjdjnxfskvm.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_R3mRiwGPxxKkCfQS6MY0pw_qncFUqzL",
      SUPABASE_SERVICE_ROLE_KEY: "sb_secret_oiYpId6p3VLscZWDGpR06w_bB74jRvU",
      USE_MOCK_SUPABASE: "false",
      NEXT_PUBLIC_USE_MOCK_SUPABASE: "false",
      E2E_BYPASS_AUTH: "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
        // 簡化啟動選項以提高性能
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-background-networking',
            '--disable-sync',
            '--disable-translate',
            '--disable-features=VizDisplayCompositor'
          ],
          // 增加啟動超時
          timeout: 60000,
        }
      },
    },
  ],
  // 增加全域超時設定
  globalTimeout: 600_000, // 10 分鐘全域超時
  // 減少並發工作數以減輕系統負載
  workers: 1,
});
