import { test, expect } from "@playwright/test";
import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { Buffer } from "node:buffer";

interface Exercise {
  id: string;
  user_id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const user = {
  id: "user-123",
  email: "demo@example.com",
};

const initialExercises: Exercise[] = [
  {
    id: "exercise-1",
    user_id: user.id,
    name: "Bench Press",
    muscle_group: "Chest",
    equipment: "Barbell",
    notes: "3x5",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

let exercisesStore: Exercise[] = initialExercises.map((exercise) => ({ ...exercise }));

function resetExercises() {
  exercisesStore = initialExercises.map((exercise) => ({ ...exercise }));
}

function createSessionCookieValue(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 })
  ).toString("base64url");
  const accessToken = `${header}.${payload}.signature`;

  return JSON.stringify([accessToken, "test-refresh-token", null, null, null]);
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function readBody(req: IncomingMessage) {
  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req
      .on("data", (chunk) => {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      })
      .on("end", () => {
        resolve(Buffer.concat(chunks).toString("utf8"));
      })
      .on("error", (error) => reject(error));
  });
}

const supabaseStub = createServer(async (req, res) => {
  const url = new URL(req.url ?? "", "http://localhost:54321");
  const method = req.method ?? "GET";


  if (method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
    sendJson(res, 200, {
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      user,
    });
    return;
  }

  if (url.pathname === "/auth/v1/user" && method === "GET") {
    sendJson(res, 200, { user });
    return;
  }

  if (url.pathname === "/auth/v1/session" && method === "GET") {
    sendJson(res, 200, {
      session: {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        user,
      },
    });
    return;
  }

  if (url.pathname === "/rest/v1/exercises") {
    if (method === "GET") {
      const userFilter = url.searchParams.get("user_id");
      const orderParam = url.searchParams.get("order");

      let items = exercisesStore;
      if (userFilter?.startsWith("eq.")) {
        const userId = userFilter.slice(3);
        items = items.filter((exercise) => exercise.user_id === userId);
      }

      if (orderParam) {
        const [column, direction] = orderParam.split(".");
        items = [...items].sort((a, b) => {
          const aValue = (a as Record<string, unknown>)[column];
          const bValue = (b as Record<string, unknown>)[column];
          if (typeof aValue === "string" && typeof bValue === "string") {
            return direction === "desc" ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
          }
          return 0;
        });
      }

      sendJson(
        res,
        200,
        items.map(({ id, name, muscle_group, equipment, notes, updated_at }) => ({
          id,
          name,
          muscle_group,
          equipment,
          notes,
          updated_at,
        }))
      );
      return;
    }

    if (method === "POST") {
      const bodyText = await readBody(req);
      const payload = bodyText ? (JSON.parse(bodyText) as Partial<Exercise>) : {};
      const timestamp = new Date().toISOString();
      const newExercise: Exercise = {
        id: `exercise-${exercisesStore.length + 1}`,
        user_id: payload.user_id ?? user.id,
        name: payload.name ?? "Untitled",
        muscle_group: (payload.muscle_group ?? null) as string | null,
        equipment: (payload.equipment ?? null) as string | null,
        notes: (payload.notes ?? null) as string | null,
        created_at: timestamp,
        updated_at: timestamp,
      };
      exercisesStore = [newExercise, ...exercisesStore];
      sendJson(res, 201, newExercise);
      return;
    }
  }

  res.statusCode = 404;
  res.end();
});

let serverStarted = false;

test.beforeAll(async () => {
  if (!serverStarted) {
    await new Promise<void>((resolve) => {
      supabaseStub.listen(54321, resolve);
    });
    serverStarted = true;
  }
});

test.afterAll(async () => {
  if (serverStarted) {
    await new Promise<void>((resolve, reject) => {
      supabaseStub.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    serverStarted = false;
  }
});

test.describe("exercises", () => {
  test.beforeEach(async ({ context }) => {
    resetExercises();
    await context.clearCookies();
    const sessionCookieValue = createSessionCookieValue(user.id);

    await context.addCookies([
      {
        name: "sb-localhost-auth-token",
        value: sessionCookieValue,
        domain: "127.0.0.1",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        secure: false,
      },
      {
        name: "sb-localhost-auth-token",
        value: sessionCookieValue,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        secure: false,
      },
    ]);
  });

  test("authenticated user can create an exercise", async ({ page }) => {
    await page.goto("/exercises");
    await expect(page).toHaveURL(/\/exercises$/);

    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bench Press" })).toBeVisible();

    await page.fill("#name", "Front Squat");
    await page.fill("#muscle_group", "Quads");
    await page.fill("#equipment", "Barbell");
    await page.fill("#notes", "Keep torso upright");

    const responsePromise = page.waitForResponse((response) => {
      return response.url().includes("/api/exercises") && response.request().method() === "POST";
    });

    await page.getByRole("button", { name: /save exercise/i }).click();
    await responsePromise;

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
