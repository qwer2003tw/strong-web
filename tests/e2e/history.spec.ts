import { test, expect } from "@playwright/test";

type OneRepMaxStub = {
  series: Array<{
    exerciseId: string;
    exerciseName: string;
    performedOn: string;
    estimatedOneRm: number;
    reps: number;
    weight: number;
    unit: string | null;
    sourceEntryId: string | null;
  }>;
  max: OneRepMaxStub["series"][number] | null;
  method: "epley" | "brzycki";
  filters: {
    exerciseIds: string[];
    dateFrom: string | null;
    dateTo: string | null;
  };
};
import { createServer, type Server } from "http";

function createSessionCookie() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sub: "user-123" })
  ).toString("base64url");
  const accessToken = `${header}.${payload}.signature`;
  return JSON.stringify([accessToken, "stub-refresh-token", null, null, null]);
}

let supabaseServer: Server | undefined;

test.beforeAll(async () => {
  supabaseServer = await new Promise<Server>((resolve) => {
    const server = createServer((req, res) => {
      const url = req.url ?? "";
      if (url.startsWith("/auth/v1/token")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            access_token: "stub-access-token",
            refresh_token: "stub-refresh-token",
            expires_in: 3600,
            token_type: "bearer",
            user: { id: "user-123", email: "test@example.com" },
          })
        );
        return;
      }
      if (url.startsWith("/auth/v1/user")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ user: { id: "user-123", email: "test@example.com" } }));
        return;
      }
      if (url.startsWith("/rest/v1")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify([]));
        return;
      }
      res.writeHead(404).end();
    });
    server.listen(54321, "127.0.0.1", () => resolve(server));
  });
});

test.afterAll(async () => {
  if (!supabaseServer) return;
  await new Promise<void>((resolve) => supabaseServer!.close(() => resolve()));
});

test.describe("history dashboard", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("unauthenticated users reach history in test mode", async ({ page }) => {
    await page.goto("/history");
    await expect(page).toHaveURL(/\/history$/);
  });

  test("authenticated users can switch ranges and see updated history", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "supabase.auth.token",
        value: createSessionCookie(),
        url: "http://127.0.0.1:3000",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const historyByRange = {
      "30d": {
        data: [
          {
            id: "30d-entry",
            workoutId: "w1",
            exerciseId: "e1",
            exerciseName: "Bench Press",
            muscleGroup: "Chest",
            performedAt: "2024-03-01T12:00:00Z",
            sets: 3,
            reps: 10,
            weight: 100,
            totalVolume: 3000,
            unit: "metric",
          },
        ],
        trend: [
          { date: "2024-02-01", totalVolume: 1500 },
          { date: "2024-02-15", totalVolume: 2000 },
          { date: "2024-03-01", totalVolume: 3000 },
        ],
        range: "30d",
        lastSyncedAt: "2024-03-02T00:00:00Z",
      },
      "7d": {
        data: [
          {
            id: "7d-entry",
            workoutId: "w2",
            exerciseId: "e2",
            exerciseName: "Deadlift",
            muscleGroup: "Back",
            performedAt: "2024-03-05T12:00:00Z",
            sets: 4,
            reps: 5,
            weight: 140,
            totalVolume: 2800,
            unit: "metric",
          },
        ],
        trend: [
          { date: "2024-02-28", totalVolume: 900 },
          { date: "2024-03-01", totalVolume: 1200 },
          { date: "2024-03-05", totalVolume: 2800 },
        ],
        range: "7d",
        lastSyncedAt: "2024-03-06T00:00:00Z",
      },
    } as const;

    const summaryPayload = {
      data: [
        { period: "7d", totalVolume: 700 },
        { period: "30d", totalVolume: 3000 },
      ],
      lastSyncedAt: "2024-03-02T00:00:00Z",
    };

    const oneRepMaxPayload: Record<"epley" | "brzycki", { data: OneRepMaxStub; lastSyncedAt: string }> = {
        epley: {
          data: {
            series: [
              {
                exerciseId: "ex-1",
                exerciseName: "Bench Press",
                performedOn: "2024-03-01T00:00:00.000Z",
                estimatedOneRm: 120,
                reps: 5,
                weight: 100,
                unit: "metric",
                sourceEntryId: "entry-1",
              },
            ],
            max: {
              exerciseId: "ex-1",
              exerciseName: "Bench Press",
              performedOn: "2024-03-01T00:00:00.000Z",
              estimatedOneRm: 120,
              reps: 5,
              weight: 100,
              unit: "metric",
              sourceEntryId: "entry-1",
            },
            method: "epley",
            filters: {
              exerciseIds: [],
              dateFrom: "2024-02-24",
              dateTo: "2024-03-01",
            },
          },
          lastSyncedAt: "2024-03-02T00:00:00Z",
        },
        brzycki: {
          data: {
            series: [
              {
                exerciseId: "ex-2",
                exerciseName: "Deadlift",
                performedOn: "2024-03-05T00:00:00.000Z",
                estimatedOneRm: 180,
                reps: 3,
                weight: 150,
                unit: "metric",
                sourceEntryId: "entry-2",
              },
            ],
            max: {
              exerciseId: "ex-2",
              exerciseName: "Deadlift",
              performedOn: "2024-03-05T00:00:00.000Z",
              estimatedOneRm: 180,
              reps: 3,
              weight: 150,
              unit: "metric",
              sourceEntryId: "entry-2",
            },
            method: "brzycki",
            filters: {
              exerciseIds: [],
              dateFrom: "2024-02-24",
              dateTo: "2024-03-05",
            },
          },
          lastSyncedAt: "2024-03-05T10:00:00Z",
        },
      };

    await page.route("**/api/history?*", async (route) => {
      const requestUrl = new URL(route.request().url());
      const range = (requestUrl.searchParams.get("range") || "30d") as keyof typeof historyByRange;
      const payload = historyByRange[range];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    await page.route("**/api/analytics/volume", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(summaryPayload),
      });
    });

    await page.route("**/api/analytics/one-rep-max?*", async (route) => {
      const url = new URL(route.request().url());
      const method = (url.searchParams.get("method") ?? "epley") as "epley" | "brzycki";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { ETag: `"stub-${method}"` },
        body: JSON.stringify(oneRepMaxPayload[method]),
      });
    });

    await page.goto("/history");
    if (!page.url().endsWith("/history")) {
      await context.addCookies([
        {
          name: "supabase.auth.token",
          value: createSessionCookie(),
          url: "http://127.0.0.1:3000",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await page.goto("/history");
    }
    await expect(page).toHaveURL(/\/history$/);

    const historyRequestPromise = page.waitForRequest((request) =>
      request.url().includes("/api/history?range=30d")
    );
    const summaryRequestPromise = page.waitForRequest((request) =>
      request.url().includes("/api/analytics/volume")
    );
    const oneRmRequestPromise = page.waitForRequest((request) =>
      request.url().includes("/api/analytics/one-rep-max")
    );
    await page.getByRole("button", { name: "Refresh" }).click();
    await Promise.all([historyRequestPromise, summaryRequestPromise, oneRmRequestPromise]);

    await expect(page.getByText("No sessions yet")).not.toBeVisible();
    const benchEntry = page.locator("div").filter({ hasText: "Bench Press" }).first();
    await expect(benchEntry).toBeVisible();
    const selectedRangeValue = page
      .getByText("Selected range")
      .locator("xpath=following-sibling::p[1]");
    await expect(selectedRangeValue).toHaveText("3,000");

    const areaPath = page.locator(".recharts-area-area").first();
    await expect(areaPath).toBeVisible();
    const initialPath = await areaPath.getAttribute("d");
    expect(initialPath).toBeTruthy();

    await page.getByLabel("Range").selectOption("7d");

    const deadliftEntry = page.locator("div").filter({ hasText: "Deadlift" }).first();
    await expect(deadliftEntry).toBeVisible();
    await expect(selectedRangeValue).toHaveText("700");

    await expect.poll(async () => await areaPath.getAttribute("d")).not.toBe(initialPath);

    await page.getByLabel("Range").selectOption("30d");
    await expect(page.getByText("Bench Press")).toBeVisible();
    await expect(selectedRangeValue).toHaveText("3,000");
  });
});
    await expect(page.getByText("Bench Press")).toBeVisible();

    const formulaSelect = page.getByLabel("Formula");
    await formulaSelect.selectOption("brzycki");

    await page.waitForRequest((request) =>
      request.url().includes("/api/analytics/one-rep-max") && request.url().includes("method=brzycki")
    );

    await expect(page.getByText("Deadlift")).toBeVisible();
