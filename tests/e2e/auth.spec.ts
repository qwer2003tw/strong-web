import { test, expect, Page } from "@playwright/test";
import { Buffer } from "buffer";

type SupabaseMockResult = {
  data?: Record<string, unknown> | null;
  error: { message: string } | null;
};

type SupabaseMockState = {
  signInResult: SupabaseMockResult;
  signUpResult: SupabaseMockResult;
  oauthResult: SupabaseMockResult;
  lastSignInWithPassword?: Record<string, unknown>;
  lastSignUp?: Record<string, unknown>;
  lastOAuth?: Record<string, unknown>;
  session: Record<string, unknown> | null;
  routerReplacements?: unknown[][];
};

declare global {
  interface Window {
    __supabaseMockState: SupabaseMockState;
    __supabaseMock?: unknown;
  }
}

const VALID_EMAIL = "user@example.com";
const VALID_PASSWORD = "validPass123";
const SHORT_PASSWORD = "short";
const MOCK_SESSION_COOKIE = "__supabase_session_mock";

async function setMockResult(
  page: Page,
  key: keyof SupabaseMockState,
  result: SupabaseMockResult,
) {
  await page.evaluate(
    ([mockKey, mockResult]) => {
      (window as unknown as { __supabaseMockState: SupabaseMockState }).__supabaseMockState[mockKey] = mockResult;
    },
    [key, result] as const,
  );
}

async function setMockSessionCookie(page: Page) {
  const session = { user: { id: "test-user" } } satisfies Record<string, unknown>;
  const value = Buffer.from(JSON.stringify(session)).toString("base64");

  await page.context().addCookies([
    {
      name: MOCK_SESSION_COOKIE,
      value,
      url: "http://127.0.0.1:3000",
    },
  ]);

  await page.addInitScript((initialSession) => {
    if (typeof window !== "undefined") {
      const state = (window as unknown as { __supabaseMockState?: SupabaseMockState }).__supabaseMockState;
      if (state) {
        state.session = initialSession;
      } else {
        Object.defineProperty(window, "__supabaseMockInitialSession", {
          value: initialSession,
          configurable: true,
          writable: false,
        });
      }
    }
  }, session);
}

async function disableNativeFormValidation(page: Page) {
  await page.evaluate(() => {
    const form = document.querySelector("form");
    if (form instanceof HTMLFormElement) {
      form.setAttribute("novalidate", "true");
    }
  });
}

const successResult: SupabaseMockResult = { data: {}, error: null };
const failureResult = (message: string): SupabaseMockResult => ({ data: null, error: { message } });

test.describe("authentication", () => {
  test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
      const subscriptions = new Set<{ unsubscribe: () => void }>();
      const state: SupabaseMockState = {
        signInResult: { data: {}, error: null },
        signUpResult: { data: {}, error: null },
        oauthResult: { data: {}, error: null },
        session: null,
        routerReplacements: [],
      };

      Object.defineProperty(window, "__supabaseMockState", {
        value: state,
        configurable: true,
        writable: false,
      });

      const initialSession = (window as unknown as { __supabaseMockInitialSession?: SupabaseMockState["session"] })
        .__supabaseMockInitialSession;
      if (initialSession) {
        state.session = initialSession;
      }

      window.__supabaseMock = {
        auth: {
          signInWithPassword: async (credentials: Record<string, unknown>) => {
            state.lastSignInWithPassword = credentials;
            return state.signInResult;
          },
          signUp: async (credentials: Record<string, unknown>) => {
            state.lastSignUp = credentials;
            return state.signUpResult;
          },
          signInWithOAuth: async (options: Record<string, unknown>) => {
            state.lastOAuth = options;
            return state.oauthResult;
          },
          getSession: async () => ({
            data: { session: state.session },
            error: null,
          }),
          onAuthStateChange: (
            callback: (event: string, session: Record<string, unknown> | null) => void,
          ) => {
            const subscription = {
              unsubscribe: () => {
                subscriptions.delete(subscription);
              },
            };
            subscriptions.add(subscription);
            callback("INITIAL_SESSION", state.session);
            return {
              data: { subscription },
              error: null,
            };
          },
        },
      } as unknown as Window["__supabaseMock"];
    });
  });

  test("sign-in page renders", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("can navigate to sign-up", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: /create account/i }).click();
    await expect(page).toHaveURL(/sign-up/);
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
  });

  test.describe("sign-in form", () => {
    test("shows validation error for invalid email", async ({ page }) => {
      await page.goto("/sign-in");
      await page.getByLabel(/email/i).fill("invalid-email");
      await page.getByLabel(/password/i).fill(VALID_PASSWORD);
      await disableNativeFormValidation(page);
      await page.getByRole("button", { name: /sign in/i }).click();
      await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    });

    test("shows validation error for short password", async ({ page }) => {
      await page.goto("/sign-in");
      await page.getByLabel(/email/i).fill(VALID_EMAIL);
      await page.getByLabel(/password/i).fill(SHORT_PASSWORD);
      await page.getByRole("button", { name: /sign in/i }).click();
      await expect(page.getByText("Password must be at least 8 characters long")).toBeVisible();
    });

    test("redirects to workouts after successful password sign-in", async ({ page }) => {
      await page.goto("/sign-in");
      await captureRouterReplacements(page);
      await setMockResult(page, "signInResult", successResult);
      await page.getByLabel(/email/i).fill(VALID_EMAIL);
      await page.getByLabel(/password/i).fill(VALID_PASSWORD);
      await page.getByRole("button", { name: /sign in/i }).click();
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const replacements = (window as unknown as { __supabaseMockState: SupabaseMockState }).__supabaseMockState
              .routerReplacements;
            return replacements?.[0]?.[0] ?? null;
          }),
        { timeout: 5_000 }
      ).toBe("/workouts");
    });

    test("renders Supabase password error", async ({ page }) => {
      await page.goto("/sign-in");
      await setMockResult(page, "signInResult", failureResult("Invalid login"));
      await page.getByLabel(/email/i).fill(VALID_EMAIL);
      await page.getByLabel(/password/i).fill(VALID_PASSWORD);
      await page.getByRole("button", { name: /sign in/i }).click();
      await expect(page.getByText("Invalid login")).toBeVisible();
    });

    test("renders Supabase OAuth error", async ({ page }) => {
      await page.goto("/sign-in");
      await setMockResult(page, "oauthResult", failureResult("OAuth sign-in failed"));
      await page.getByRole("button", { name: /github/i }).click();
      await expect(page.getByText("OAuth sign-in failed")).toBeVisible();
    });
  });

  test.describe("sign-up form", () => {
    test("shows validation error for invalid email", async ({ page }) => {
      await page.goto("/sign-up");
      await page.getByLabel(/email/i).fill("invalid-email");
      await page.getByLabel(/password/i).fill(VALID_PASSWORD);
      await disableNativeFormValidation(page);
      await page.getByRole("button", { name: /create account/i }).click();
      await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    });

    test("shows validation error for short password", async ({ page }) => {
      await page.goto("/sign-up");
      await page.getByLabel(/email/i).fill(VALID_EMAIL);
      await page.getByLabel(/password/i).fill(SHORT_PASSWORD);
      await page.getByRole("button", { name: /create account/i }).click();
      await expect(page.getByText("Password must be at least 8 characters long")).toBeVisible();
    });

    test("redirects to workouts after successful sign-up", async ({ page }) => {
      await page.goto("/sign-up");
      await captureRouterReplacements(page);
      await setMockResult(page, "signUpResult", successResult);
      await page.getByLabel(/email/i).fill(VALID_EMAIL);
      await page.getByLabel(/password/i).fill(VALID_PASSWORD);
      await page.getByRole("button", { name: /create account/i }).click();
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const replacements = (window as unknown as { __supabaseMockState: SupabaseMockState }).__supabaseMockState
              .routerReplacements;
            return replacements?.[0]?.[0] ?? null;
          }),
        { timeout: 5_000 }
      ).toBe("/workouts");
    });

    test("renders Supabase sign-up error", async ({ page }) => {
      await page.goto("/sign-up");
      await setMockResult(page, "signUpResult", failureResult("Email already registered"));
      await page.getByLabel(/email/i).fill(VALID_EMAIL);
      await page.getByLabel(/password/i).fill(VALID_PASSWORD);
      await page.getByRole("button", { name: /create account/i }).click();
      await expect(page.getByText("Email already registered")).toBeVisible();
    });

    test("renders Supabase OAuth error", async ({ page }) => {
      await page.goto("/sign-up");
      await setMockResult(page, "oauthResult", failureResult("OAuth sign-up failed"));
      await page.getByRole("button", { name: /google/i }).click();
      await expect(page.getByText("OAuth sign-up failed")).toBeVisible();
    });
  });

  test("authenticated session visiting sign-in redirects to workouts", async ({ page }) => {
    await setMockSessionCookie(page);
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/workouts/);
    await page.context().clearCookies();
  });

  test("authenticated session visiting sign-up redirects to workouts", async ({ page }) => {
    await setMockSessionCookie(page);
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/workouts/);
    await page.context().clearCookies();
  });
});

async function captureRouterReplacements(page: Page) {
  await page.evaluate(() => {
    const globalState = (window as unknown as { __supabaseMockState: SupabaseMockState }).__supabaseMockState;
    if (!globalState.routerReplacements) {
      globalState.routerReplacements = [];
    }

    const router = (window as unknown as { next?: { router?: { replace: (...args: unknown[]) => unknown } } }).next?.router;
    if (router && !(globalState as { __routerPatched?: boolean }).__routerPatched) {
      const originalReplace = router.replace.bind(router);
      router.replace = (...args: unknown[]) => {
        globalState.routerReplacements?.push(args);
        return originalReplace(...args);
      };
      (globalState as { __routerPatched?: boolean }).__routerPatched = true;
    }
  });
}

