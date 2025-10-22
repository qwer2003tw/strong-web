import type { Database } from "@/types/db";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];
export type WorkoutInsert = Database["public"]["Tables"]["workouts"]["Insert"];
export type WorkoutEntryRow = Database["public"]["Tables"]["workout_entries"]["Row"];
export type WorkoutEntryInsert = Database["public"]["Tables"]["workout_entries"]["Insert"];
export type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];

type WorkoutWithEntries = WorkoutRow & {
  workout_entries?: (WorkoutEntryRow & { exercises: Pick<ExerciseRow, "id" | "name" | "muscle_group"> | null })[];
};

export type MockSupabaseStore = {
  userId: string;
  profiles: ProfileRow[];
  workouts: WorkoutRow[];
  workoutEntries: WorkoutEntryRow[];
  exercises: ExerciseRow[];
};

type MockSupabaseContainer = {
  store: MockSupabaseStore;
  counters: {
    workouts: number;
    workoutEntries: number;
    exercises: number;
  };
};

type SupabaseResult<T> = Promise<{ data: T; error: null } | { data: null; error: { message: string } }>;

type MaybeSupabaseResult<T> = Promise<{ data: T | null; error: null } | { data: null; error: { message: string } }>;

declare global {
  // eslint-disable-next-line no-var -- augment global for test mocking
  var __mockSupabaseContainer: MockSupabaseContainer | undefined;
}

function isoNow() {
  return new Date().toISOString();
}

function createDefaultStore(): MockSupabaseStore {
  const now = isoNow();
  return {
    userId: "mock-user",
    profiles: [
      {
        id: "mock-user",
        email: "mock@example.com",
        full_name: "Mock User",
        avatar_url: null,
        locale: "en",
        theme: "system",
        unit_preference: "metric",
        created_at: now,
        updated_at: now,
      },
    ],
    workouts: [
      {
        id: "workout-1",
        user_id: "mock-user",
        title: "Foundation Day",
        notes: "Strength focus",
        scheduled_for: now.slice(0, 10),
        status: "scheduled",
        created_at: now,
        updated_at: now,
      },
    ],
    workoutEntries: [
      {
        id: "entry-1",
        workout_id: "workout-1",
        exercise_id: "exercise-1",
        position: 1,
        sets: 3,
        reps: 8,
        weight: 80,
        unit: "metric",
        notes: "Warm up included",
        created_at: now,
        updated_at: now,
      },
    ],
    exercises: [
      {
        id: "exercise-1",
        user_id: "mock-user",
        name: "Bench Press",
        muscle_group: "chest",
        equipment: "barbell",
        notes: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: "exercise-2",
        user_id: "mock-user",
        name: "Deadlift",
        muscle_group: "back",
        equipment: "barbell",
        notes: null,
        created_at: now,
        updated_at: now,
      },
    ],
  };
}

function getContainer(): MockSupabaseContainer {
  if (!globalThis.__mockSupabaseContainer) {
    const store = createDefaultStore();
    globalThis.__mockSupabaseContainer = {
      store,
      counters: {
        workouts: store.workouts.length,
        workoutEntries: store.workoutEntries.length,
        exercises: store.exercises.length,
      },
    };
  }
  return globalThis.__mockSupabaseContainer;
}

export function getMockSupabaseStore(): MockSupabaseStore {
  return getContainer().store;
}

export function resetMockSupabaseStore(partial?: Partial<MockSupabaseStore>) {
  const defaultStore = createDefaultStore();
  const nextStore: MockSupabaseStore = {
    userId: partial?.userId ?? defaultStore.userId,
    profiles: partial?.profiles ?? defaultStore.profiles.map((profile) => ({ ...profile })),
    workouts: partial?.workouts ?? defaultStore.workouts.map((workout) => ({ ...workout })),
    workoutEntries:
      partial?.workoutEntries ?? defaultStore.workoutEntries.map((entry) => ({ ...entry })),
    exercises: partial?.exercises ?? defaultStore.exercises.map((exercise) => ({ ...exercise })),
  };

  globalThis.__mockSupabaseContainer = {
    store: nextStore,
    counters: {
      workouts: nextStore.workouts.length,
      workoutEntries: nextStore.workoutEntries.length,
      exercises: nextStore.exercises.length,
    },
  };
}

function nextId(prefix: "workout" | "entry" | "exercise") {
  const container = getContainer();
  if (prefix === "workout") {
    container.counters.workouts += 1;
    return `workout-${container.counters.workouts}`;
  }
  if (prefix === "entry") {
    container.counters.workoutEntries += 1;
    return `entry-${container.counters.workoutEntries}`;
  }
  container.counters.exercises += 1;
  return `exercise-${container.counters.exercises}`;
}

function cloneWorkoutWithEntries(workout: WorkoutRow, selection?: string): WorkoutWithEntries {
  const store = getMockSupabaseStore();
  if (selection?.includes("workout_entries")) {
    const entries = store.workoutEntries
      .filter((entry) => entry.workout_id === workout.id)
      .sort((a, b) => a.position - b.position)
      .map((entry) => ({
        ...entry,
        exercises:
          store.exercises
            .map((exercise) => ({ id: exercise.id, name: exercise.name, muscle_group: exercise.muscle_group }))
            .find((exercise) => exercise.id === entry.exercise_id) ?? null,
      }));
    return { ...workout, workout_entries: entries };
  }
  return { ...workout };
}

function applyFilters<T extends Record<string, unknown>>(records: T[], filters: [string, unknown][]) {
  return records.filter((record) => filters.every(([column, value]) => record[column] === value));
}

class ProfilesSelectBuilder {
  constructor(_selection: string | undefined, private filters: [string, unknown][] = []) { }

  eq(column: keyof ProfileRow, value: unknown) {
    this.filters.push([column as string, value]);
    return this;
  }

  abortSignal(_signal: AbortSignal) {
    return this;
  }

  async maybeSingle(): MaybeSupabaseResult<ProfileRow> {
    const store = getMockSupabaseStore();
    const filtered = applyFilters(store.profiles, this.filters);
    const record = filtered[0];
    return { data: record ? { ...record } : null, error: null };
  }

  async single(): SupabaseResult<ProfileRow> {
    const result = await this.maybeSingle();
    if (!result.data) {
      return { data: null, error: { message: "No rows" } };
    }
    return { data: result.data, error: null };
  }
}

class ProfilesUpsertSelectBuilder {
  constructor(private resolveResult: () => SupabaseResult<ProfileRow[]>) { }

  async single(): SupabaseResult<ProfileRow> {
    const result = await this.resolveResult();
    if (result.error) {
      return { data: null, error: result.error };
    }
    const record = result.data[0];
    if (!record) {
      return { data: null, error: { message: "No rows" } };
    }
    return { data: record, error: null };
  }

  async maybeSingle(): MaybeSupabaseResult<ProfileRow> {
    const result = await this.resolveResult();
    if (result.error) {
      return { data: null, error: result.error };
    }
    const record = result.data[0] ?? null;
    return { data: record, error: null };
  }
}

class ProfilesUpsertBuilder {
  private resultPromise: SupabaseResult<ProfileRow[]> | null = null;

  constructor(private values: ProfileInsert | ProfileInsert[]) { }

  private performUpsert(): SupabaseResult<ProfileRow[]> {
    const container = getContainer();
    const { store } = container;
    const payloads = Array.isArray(this.values) ? this.values : [this.values];

    for (const payload of payloads) {
      if (!payload.id) {
        return Promise.resolve({ data: null, error: { message: "Mock Supabase: profiles upsert requires id" } });
      }
    }

    const results: ProfileRow[] = [];

    for (const payload of payloads) {
      const id = payload.id as string;
      const existingIndex = store.profiles.findIndex((profile) => profile.id === id);
      const existing = existingIndex >= 0 ? store.profiles[existingIndex] : undefined;
      const timestamp = isoNow();
      const nextProfile: ProfileRow = {
        id,
        email: payload.email ?? existing?.email ?? null,
        full_name: payload.full_name ?? existing?.full_name ?? null,
        avatar_url: payload.avatar_url ?? existing?.avatar_url ?? null,
        locale: payload.locale ?? existing?.locale ?? "en",
        theme: payload.theme ?? existing?.theme ?? "system",
        unit_preference: payload.unit_preference ?? existing?.unit_preference ?? "metric",
        created_at: existing?.created_at ?? timestamp,
        updated_at: timestamp,
      };

      if (existingIndex >= 0) {
        store.profiles.splice(existingIndex, 1, nextProfile);
      } else {
        store.profiles.push(nextProfile);
      }

      results.push({ ...nextProfile });
    }

    return Promise.resolve({ data: results, error: null });
  }

  private ensureResult() {
    if (!this.resultPromise) {
      this.resultPromise = this.performUpsert();
    }
    return this.resultPromise;
  }

  abortSignal(_signal: AbortSignal) {
    return this;
  }

  select(_selection?: string) {
    return new ProfilesUpsertSelectBuilder(() => this.ensureResult());
  }

  execute() {
    return this.ensureResult();
  }

  then<TResult1 = Awaited<SupabaseResult<ProfileRow[]>>, TResult2 = never>(
    resolve?: ((value: Awaited<SupabaseResult<ProfileRow[]>>) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.ensureResult().then(resolve, reject);
  }

  catch<TResult = never>(reject?: (reason: unknown) => TResult | PromiseLike<TResult>) {
    return this.ensureResult().catch(reject);
  }
}

function orderByScheduled(records: WorkoutRow[], ascending: boolean, nullsFirst?: boolean) {
  return [...records].sort((a, b) => {
    if (a.scheduled_for === b.scheduled_for) return 0;
    if (a.scheduled_for === null || a.scheduled_for === undefined) {
      return nullsFirst ? -1 : 1;
    }
    if (b.scheduled_for === null || b.scheduled_for === undefined) {
      return nullsFirst ? 1 : -1;
    }
    if (ascending) {
      return a.scheduled_for.localeCompare(b.scheduled_for);
    }
    return b.scheduled_for.localeCompare(a.scheduled_for);
  });
}

class WorkoutsSelectBuilder {
  constructor(private selection: string | undefined, private filters: [string, unknown][] = []) { }

  eq(column: keyof WorkoutRow, value: unknown) {
    this.filters.push([column as string, value]);
    return this;
  }

  order(column: keyof WorkoutRow, options: { ascending: boolean; nullsFirst?: boolean }) {
    const store = getMockSupabaseStore();
    if (column !== "scheduled_for") {
      const filtered = applyFilters(store.workouts, this.filters);
      return Promise.resolve({ data: filtered.map((workout) => cloneWorkoutWithEntries(workout, this.selection)), error: null });
    }
    const filtered = orderByScheduled(applyFilters(store.workouts, this.filters), options.ascending, options.nullsFirst);
    return Promise.resolve({ data: filtered.map((workout) => cloneWorkoutWithEntries(workout, this.selection)), error: null });
  }

  async maybeSingle(): MaybeSupabaseResult<WorkoutWithEntries> {
    const store = getMockSupabaseStore();
    const filtered = applyFilters(store.workouts, this.filters);
    const workout = filtered[0];
    if (!workout) {
      return { data: null, error: null };
    }
    return { data: cloneWorkoutWithEntries(workout, this.selection), error: null };
  }

  async single(): SupabaseResult<WorkoutWithEntries> {
    const store = getMockSupabaseStore();
    const filtered = applyFilters(store.workouts, this.filters);
    const workout = filtered[0];
    if (!workout) {
      return { data: null, error: { message: "Workout not found" } };
    }
    return { data: cloneWorkoutWithEntries(workout, this.selection), error: null };
  }
}

class WorkoutsUpdateBuilder {
  private filters: [string, unknown][] = [];

  constructor(private values: Record<string, unknown>) { }

  eq(column: keyof WorkoutRow, value: unknown) {
    this.filters.push([column as string, value]);
    return this;
  }

  select(_: string) {
    return {
      single: async (): SupabaseResult<WorkoutWithEntries> => {
        const store = getMockSupabaseStore();
        const record = store.workouts.find((workout) => this.filters.every(([column, value]) => workout[column as keyof WorkoutRow] === value));
        if (!record) {
          return { data: null, error: { message: "Workout not found" } };
        }
        Object.assign(record, this.values);
        return { data: cloneWorkoutWithEntries(record), error: null };
      },
    };
  }
}

class WorkoutsDeleteBuilder {
  private filters: [string, unknown][] = [];

  eq(column: keyof WorkoutRow, value: unknown) {
    this.filters.push([column as string, value]);
    return this;
  }

  async execute() {
    const container = getContainer();
    const { store } = container;
    const toDelete = store.workouts.filter((workout) => this.filters.every(([column, value]) => workout[column as keyof WorkoutRow] === value));
    const ids = new Set(toDelete.map((workout) => workout.id));
    container.store = {
      ...store,
      workouts: store.workouts.filter((workout) => !ids.has(workout.id)),
      workoutEntries: store.workoutEntries.filter((entry) => !ids.has(entry.workout_id)),
    };
    return { data: null, error: null };
  }

  then<TResult1 = unknown, TResult2 = never>(resolve?: ((value: { data: null; error: null }) => TResult1 | PromiseLike<TResult1>) | null, reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) {
    return this.execute().then(resolve, reject);
  }
}

class WorkoutsInsertBuilder {
  constructor(private values: WorkoutInsert | WorkoutInsert[]) { }

  select(_: string) {
    return {
      single: async (): SupabaseResult<WorkoutWithEntries> => {
        const inserts = Array.isArray(this.values) ? this.values : [this.values];
        const insert = inserts[0];
        const now = isoNow();
        const record: WorkoutRow = {
          id: insert.id ?? nextId("workout"),
          user_id: insert.user_id,
          title: insert.title,
          notes: insert.notes ?? null,
          scheduled_for: insert.scheduled_for ?? null,
          status: insert.status ?? "draft",
          created_at: insert.created_at ?? now,
          updated_at: insert.updated_at ?? now,
        };
        const container = getContainer();
        container.store = {
          ...container.store,
          workouts: [record, ...container.store.workouts],
        };
        return { data: cloneWorkoutWithEntries(record), error: null };
      },
    };
  }
}

class WorkoutEntriesInsertBuilder {
  constructor(private values: WorkoutEntryInsert | WorkoutEntryInsert[]) { }

  select(_: string) {
    return {
      single: async (): SupabaseResult<WorkoutEntryRow & { exercises: Pick<ExerciseRow, "id" | "name" | "muscle_group"> | null }> => {
        const inserts = Array.isArray(this.values) ? this.values : [this.values];
        const insert = inserts[0];
        const now = isoNow();
        const record: WorkoutEntryRow = {
          id: insert.id ?? nextId("entry"),
          workout_id: insert.workout_id,
          exercise_id: insert.exercise_id,
          position: insert.position,
          sets: insert.sets,
          reps: insert.reps ?? null,
          weight: insert.weight ?? null,
          unit: insert.unit ?? null,
          notes: insert.notes ?? null,
          created_at: insert.created_at ?? now,
          updated_at: insert.updated_at ?? now,
        };
        const container = getContainer();
        container.store = {
          ...container.store,
          workoutEntries: [...container.store.workoutEntries, record],
        };
        const exercise = container.store.exercises
          .map((item) => ({ id: item.id, name: item.name, muscle_group: item.muscle_group }))
          .find((item) => item.id === record.exercise_id) ?? null;
        return { data: { ...record, exercises: exercise }, error: null };
      },
    };
  }
}

class WorkoutEntriesDeleteBuilder {
  private filters: [string, unknown][] = [];

  eq(column: keyof WorkoutEntryRow, value: unknown) {
    this.filters.push([column as string, value]);
    return this;
  }

  async execute() {
    const container = getContainer();
    const { store } = container;
    const toRemove = store.workoutEntries.filter((entry) => this.filters.every(([column, value]) => entry[column as keyof WorkoutEntryRow] === value));
    const ids = new Set(toRemove.map((entry) => entry.id));
    container.store = {
      ...store,
      workoutEntries: store.workoutEntries.filter((entry) => !ids.has(entry.id)),
    };
    return { error: null };
  }

  then<TResult1 = unknown, TResult2 = never>(resolve?: ((value: { error: null }) => TResult1 | PromiseLike<TResult1>) | null, reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) {
    return this.execute().then(resolve, reject);
  }
}

class ExercisesSelectBuilder {
  private filters: [string, unknown][] = [];

  eq(column: keyof ExerciseRow, value: unknown) {
    this.filters.push([column as string, value]);
    return this;
  }

  order(column: keyof ExerciseRow, options: { ascending: boolean }) {
    const store = getMockSupabaseStore();
    const filtered = applyFilters(store.exercises, this.filters);
    const sorted = [...filtered].sort((a, b) => {
      const first = a[column] ?? "";
      const second = b[column] ?? "";
      if (typeof first === "string" && typeof second === "string") {
        return options.ascending ? first.localeCompare(second) : second.localeCompare(first);
      }
      return 0;
    });
    return Promise.resolve({ data: sorted, error: null });
  }
}

export function createMockSupabaseClient() {
  const auth = {
    getUser: async () => ({
      data: { user: { id: getMockSupabaseStore().userId } },
      error: null,
    }),
    getSession: async () => ({
      data: {
        session: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: { id: getMockSupabaseStore().userId },
        },
      },
      error: null,
    }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      // Check if there's a window.__supabaseMock with test state
      if (typeof window !== 'undefined' && (window as any).__supabaseMock) {
        const mockAuth = (window as any).__supabaseMock.auth;
        if (mockAuth && typeof mockAuth.signInWithPassword === 'function') {
          return await mockAuth.signInWithPassword(credentials);
        }
      }
      // Default successful response
      return { data: { user: { id: getMockSupabaseStore().userId } }, error: null };
    },
    signInWithOAuth: async (options: { provider: string }) => {
      // Check if there's a window.__supabaseMock with test state
      if (typeof window !== 'undefined' && (window as any).__supabaseMock) {
        const mockAuth = (window as any).__supabaseMock.auth;
        if (mockAuth && typeof mockAuth.signInWithOAuth === 'function') {
          return await mockAuth.signInWithOAuth(options);
        }
      }
      // Default successful response
      return { data: { user: { id: getMockSupabaseStore().userId } }, error: null };
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Check if there's a window.__supabaseMock with test state
      if (typeof window !== 'undefined' && (window as any).__supabaseMock) {
        const mockAuth = (window as any).__supabaseMock.auth;
        if (mockAuth && typeof mockAuth.onAuthStateChange === 'function') {
          return mockAuth.onAuthStateChange(callback);
        }
      }
      // Default implementation
      const subscription = { unsubscribe: () => { } };
      callback("INITIAL_SESSION", null);
      return { data: { subscription }, error: null };
    },
  };

  return {
    auth,
    from(table: string) {
      if (table === "profiles") {
        return {
          select: (selection?: string) => new ProfilesSelectBuilder(selection),
          upsert: (values: ProfileInsert | ProfileInsert[]) => new ProfilesUpsertBuilder(values),
        };
      }
      if (table === "workouts") {
        return {
          select: (selection?: string) => new WorkoutsSelectBuilder(selection),
          insert: (values: WorkoutInsert | WorkoutInsert[]) => new WorkoutsInsertBuilder(values),
          update: (values: Record<string, unknown>) => new WorkoutsUpdateBuilder(values),
          delete: () => new WorkoutsDeleteBuilder(),
        };
      }
      if (table === "workout_entries") {
        return {
          insert: (values: WorkoutEntryInsert | WorkoutEntryInsert[]) => new WorkoutEntriesInsertBuilder(values),
          delete: () => new WorkoutEntriesDeleteBuilder(),
        };
      }
      if (table === "exercises") {
        return {
          select: () => new ExercisesSelectBuilder(),
        };
      }
      throw new Error(`Mock Supabase: unsupported table ${table}`);
    },
  };
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
