import type { ThemePreference, UnitSystem } from "@/types/db";

type Profile = {
  id: string;
  full_name: string | null;
  locale: string;
  unit_preference: UnitSystem;
  theme?: ThemePreference;
  theme_preference?: ThemePreference;
  created_at: string;
  updated_at: string;
};

type Workout = {
  id: string;
  user_id: string;
  title: string;
  status?: string;
  notes?: string | null;
  scheduled_for?: string | null;
  created_at?: string;
  updated_at?: string;
  workout_entries?: unknown;
};

type Exercise = {
  id: string;
  user_id: string;
  name: string;
  muscle_group?: string | null;
  equipment?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

type MockSupabaseState = {
  userId: string | null;
  profiles: Record<string, Profile>;
  workouts: Workout[];
  exercises: Exercise[];
};

const STATE_KEY = Symbol.for("__MOCK_SUPABASE_STATE__");

type GlobalWithMock = typeof globalThis & {
  [STATE_KEY]?: MockSupabaseState;
};

export function isMockSupabaseEnabled() {
  const env =
    (typeof process !== "undefined" &&
      (process.env.MOCK_SUPABASE ?? process.env.NEXT_PUBLIC_MOCK_SUPABASE)) ||
    undefined;
  return env === "1";
}

function getState(): MockSupabaseState {
  const globalWithMock = globalThis as GlobalWithMock;
  if (!globalWithMock[STATE_KEY]) {
    globalWithMock[STATE_KEY] = {
      userId: null,
      profiles: {},
      workouts: [],
      exercises: [],
    };
  }
  return globalWithMock[STATE_KEY]!;
}

export function setMockSupabaseState({
  userId,
  profile,
  workouts,
  exercises,
}: {
  userId?: string | null;
  profile?: Partial<Profile> & { id: string };
  workouts?: Workout[];
  exercises?: Exercise[];
}) {
  const state = getState();
  if (typeof userId !== "undefined") {
    state.userId = userId;
  }
  if (profile) {
    const timestamp = new Date().toISOString();
    state.profiles[profile.id] = {
      id: profile.id,
      full_name: profile.full_name ?? null,
      locale: profile.locale ?? "en",
      unit_preference: profile.unit_preference ?? "metric",
      theme: profile.theme ?? profile.theme_preference ?? "system",
      theme_preference: profile.theme_preference ?? profile.theme ?? "system",
      created_at: profile.created_at ?? timestamp,
      updated_at: profile.updated_at ?? timestamp,
    } as Profile;
  }
  if (workouts) {
    state.workouts = workouts;
  }
  if (exercises) {
    state.exercises = exercises;
  }
}

export function resetMockSupabaseState() {
  const state = getState();
  state.userId = null;
  state.profiles = {};
  state.workouts = [];
  state.exercises = [];
}

export function createMockSupabaseClient() {
  const state = getState();

  return {
    auth: {
      async getSession() {
        if (!state.userId) {
          return { data: { session: null }, error: null };
        }
        return {
          data: { session: { user: { id: state.userId } } },
          error: null,
        };
      },
      async getUser() {
        if (!state.userId) {
          return { data: { user: null }, error: null };
        }
        return {
          data: { user: { id: state.userId } },
          error: null,
        };
      },
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe() {
                // no-op for mock implementation
              },
            },
          },
          error: null,
        };
      },
      async signOut() {
        state.userId = null;
        if (typeof window !== "undefined" && typeof window.fetch === "function") {
          try {
            await window.fetch("/api/test-utils/mock-supabase", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId: null }),
            });
          } catch {
            // Ignore sync errors in tests; server state will remain unchanged.
          }
        }
        return { error: null };
      },
    },
    from(table: string) {
      switch (table) {
        case "profiles": {
          return {
            select: () => ({
              eq: (_column: string, value: string) => ({
                maybeSingle: async () => ({
                  data: state.profiles[value] ?? null,
                  error: null,
                }),
              }),
            }),
            async upsert(payload: Profile) {
              const id = payload.id;
              if (!id) {
                return { data: null, error: { message: "Missing profile id" } };
              }
              const existing = state.profiles[id];
              const timestamp = new Date().toISOString();
              const nextProfile: Profile = {
                id,
                full_name: payload.full_name ?? existing?.full_name ?? null,
                locale: payload.locale ?? existing?.locale ?? "en",
                unit_preference: payload.unit_preference ?? existing?.unit_preference ?? "metric",
                theme: payload.theme ?? existing?.theme ?? existing?.theme_preference ?? "system",
                theme_preference:
                  payload.theme ?? payload.theme_preference ?? existing?.theme ?? existing?.theme_preference ?? "system",
                created_at: existing?.created_at ?? timestamp,
                updated_at: timestamp,
              } as Profile;
              state.profiles[id] = nextProfile;

              if (typeof window !== "undefined" && typeof window.fetch === "function") {
                try {
                  await window.fetch("/api/test-utils/mock-supabase", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      userId: state.userId ?? id,
                      profile: nextProfile,
                    }),
                  });
                } catch {
                  // Ignore sync errors in tests; server state will remain unchanged.
                }
              }
              return { data: null, error: null };
            },
          };
        }
        case "workouts": {
          return {
            select: () => ({
              eq: async (_column: string, value: string) => ({
                data: state.workouts.filter((workout) => workout.user_id === value),
                error: null,
              }),
            }),
          };
        }
        case "exercises": {
          return {
            select: () => ({
              eq: async (_column: string, value: string) => ({
                data: state.exercises.filter((exercise) => exercise.user_id === value),
                error: null,
              }),
            }),
          };
        }
        default:
          throw new Error(`Unsupported table requested in mock Supabase client: ${table}`);
      }
    },
  };
}
