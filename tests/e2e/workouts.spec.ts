import { test, expect, type Page } from "@playwright/test";

async function resetMockSupabase(page: Page) {
  await page.request.post("/api/test/mock-supabase", {
    data: { action: "reset" },
  });
}

test.describe("workouts", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/rest/v1/workout_entries**", async (route, request) => {
      const method = request.method();
      if (method === "OPTIONS") {
        await route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
        return;
      }

      if (method === "POST") {
        const payload = JSON.parse(request.postData() ?? "{}") as Record<string, unknown> | Record<string, unknown>[];
        const entry = Array.isArray(payload) ? (payload[0] as Record<string, unknown>) : payload;
        const response = await page.request.post("/api/test/mock-supabase", {
          data: {
            action: "insertEntry",
            entry: {
              workout_id: entry.workout_id,
              exercise_id: entry.exercise_id,
              position: entry.position,
              sets: entry.sets,
              reps: entry.reps,
              weight: entry.weight,
              unit: entry.unit,
              notes: entry.notes,
            },
          },
        });
        const json = (await response.json()) as { data: unknown; error: unknown };
        if (json.error) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify(json),
          });
          return;
        }
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify([json.data]),
        });
        return;
      }

      if (method === "DELETE") {
        const url = new URL(request.url());
        const parseFilter = (value: string | null) => value?.split(".")?.pop() ?? "";
        const id = parseFilter(url.searchParams.get("id"));
        const workoutId = parseFilter(url.searchParams.get("workout_id"));
        await page.request.post("/api/test/mock-supabase", {
          data: { action: "deleteEntry", id, workout_id: workoutId },
        });
        await route.fulfill({ status: 204, body: "{}" });
        return;
      }

      await route.fallback();
    });

    await resetMockSupabase(page);
  });

  test("allows creating, updating, and deleting workouts", async ({ page }) => {
    await page.goto("/workouts");

    const workoutTitle = `E2E Workout ${Date.now()}`;
    await page.fill("#title", workoutTitle);

    const createResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/workouts") && response.request().method() === "POST"
    );
    await page.getByRole("button", { name: /save/i }).click();
    const createResponse = await createResponsePromise;
    const createPayload = (await createResponse.json()) as { data: { id: string } };
    const workoutId = createPayload.data.id;

    await expect(page.getByRole("heading", { name: workoutTitle })).toBeVisible();

    const detailLink = page.locator(`a[href="/workouts/${workoutId}"]`).first();
    await detailLink.click();

    await expect(page).toHaveURL(`/workouts/${workoutId}`);
    await expect(page.getByRole("heading", { name: workoutTitle })).toBeVisible();

    await page.fill("#notes", "Updated notes");
    await page.selectOption("#status", "completed");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText("Workout updated")).toBeVisible();

    await page.selectOption("#exercise_id", "exercise-2");
    await page.getByRole("button", { name: /add entry/i }).click();
    await expect(page.getByText("Entry added")).toBeVisible();
    await expect(page.locator('[data-testid="workout-entry"]').first()).toBeVisible();

    await page.getByRole("button", { name: "Remove" }).first().click();
    await expect(page.getByText("Entry removed")).toBeVisible();

    await page.getByRole("button", { name: /delete/i }).click();
    await expect(page).toHaveURL(/\/workouts$/);
    await expect(page.locator(`a[href="/workouts/${workoutId}"]`)).toHaveCount(0);
  });
});
