import type { UnitSystem } from "@/lib/database.types";

export type HistoryRange = "7d" | "30d";

export interface HistoryEntry {
  id: string;
  workoutId: string | null;
  exerciseId: string | null;
  exerciseName: string;
  muscleGroup: string | null;
  performedAt: string;
  sets: number;
  reps: number | null;
  weight: number | null;
  totalVolume: number;
  unit: UnitSystem | null;
}

export interface HistoryTrendPoint {
  date: string;
  totalVolume: number;
}

export interface VolumeSummary {
  period: HistoryRange;
  totalVolume: number;
}

const RANGE_IN_DAYS: Record<HistoryRange, number> = {
  "7d": 7,
  "30d": 30,
};

interface HistoryOptions {
  referenceDate?: Date;
}

function getReferenceDate(options?: HistoryOptions) {
  return options?.referenceDate ? new Date(options.referenceDate) : new Date();
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const normalized = startOfDay(date);
  const year = normalized.getFullYear();
  const month = `${normalized.getMonth() + 1}`.padStart(2, "0");
  const day = `${normalized.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rangeStart(range: HistoryRange, options?: HistoryOptions) {
  const reference = startOfDay(getReferenceDate(options));
  const days = RANGE_IN_DAYS[range];
  const start = new Date(reference);
  start.setDate(reference.getDate() - (days - 1));
  return start;
}

export function calculateEntryVolume(
  sets: number | null,
  reps: number | null,
  weight: number | null
) {
  const resolvedSets = Number(sets ?? 0);
  const resolvedReps = Number(reps ?? 0);
  const resolvedWeight = Number(weight ?? 0);
  if (
    !Number.isFinite(resolvedSets) ||
    !Number.isFinite(resolvedReps) ||
    !Number.isFinite(resolvedWeight)
  ) {
    return 0;
  }
  if (!resolvedSets || !resolvedReps || !resolvedWeight) {
    return 0;
  }
  return resolvedSets * resolvedReps * resolvedWeight;
}

export function buildHistoryTrend(
  entries: HistoryEntry[],
  range: HistoryRange,
  options?: HistoryOptions
): HistoryTrendPoint[] {
  const reference = startOfDay(getReferenceDate(options));
  const start = rangeStart(range, options);
  const totals = new Map<string, number>();

  for (const entry of entries) {
    const performed = new Date(entry.performedAt);
    if (performed < start || performed > reference) {
      continue;
    }
    const key = formatDateKey(performed);
    const current = totals.get(key) ?? 0;
    totals.set(key, current + (entry.totalVolume ?? 0));
  }

  const days = RANGE_IN_DAYS[range];
  const trend: HistoryTrendPoint[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(reference);
    date.setDate(reference.getDate() - index);
    const key = formatDateKey(date);
    trend.push({
      date: key,
      totalVolume: totals.get(key) ?? 0,
    });
  }

  return trend;
}

export function buildVolumeSummary(
  entries: HistoryEntry[],
  options?: HistoryOptions
): VolumeSummary[] {
  const reference = startOfDay(getReferenceDate(options));
  const start7 = rangeStart("7d", { referenceDate: reference });
  const start30 = rangeStart("30d", { referenceDate: reference });

  let total7 = 0;
  let total30 = 0;

  for (const entry of entries) {
    const performed = new Date(entry.performedAt);
    if (performed >= start30 && performed <= reference) {
      total30 += entry.totalVolume ?? 0;
      if (performed >= start7) {
        total7 += entry.totalVolume ?? 0;
      }
    }
  }

  return [
    { period: "7d", totalVolume: total7 },
    { period: "30d", totalVolume: total30 },
  ];
}

interface SupabaseQueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

interface SupabaseQueryBuilder<T> {
  select(selection: string): SupabaseQueryBuilder<T>;
  eq(column: string, value: unknown): SupabaseQueryBuilder<T>;
  gte(column: string, value: unknown): SupabaseQueryBuilder<T>;
  order(column: string, config: { ascending: boolean }): SupabaseQueryBuilder<T>;
  limit(count: number): Promise<SupabaseQueryResult<T>>;
}

type SupabaseClient = {
  from<T>(table: string): SupabaseQueryBuilder<T>;
};

interface HistoryQueryRow {
  id: string;
  workout_id: string | null;
  exercise_id: string | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  unit: UnitSystem | null;
  created_at: string | null;
  workout?: {
    id?: string | null;
    user_id?: string | null;
    scheduled_for?: string | null;
  } | null;
  exercise?: {
    id?: string | null;
    name?: string | null;
    muscle_group?: string | null;
  } | null;
}

interface VolumeViewRow {
  period: string | null;
  total_volume: number | null;
  user_id?: string | null;
}

export async function getHistoryEntries(
  supabase: SupabaseClient,
  userId: string,
  range: HistoryRange
): Promise<HistoryEntry[]> {
  const since = rangeStart(range).toISOString();
  const { data, error } = await supabase
    .from<HistoryQueryRow>("workout_entries")
    .select(
      `
        id,
        workout_id,
        exercise_id,
        sets,
        reps,
        weight,
        unit,
        created_at,
        workout:workouts!inner(
          id,
          user_id,
          scheduled_for
        ),
        exercise:exercises(
          id,
          name,
          muscle_group
        )
      `
    )
    .eq("workouts.user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    throw new Error(error.message);
  }

  const now = new Date();
  return (data as HistoryQueryRow[] | null | undefined)?.map((row) => {
    const performed = row.workout?.scheduled_for ?? row.created_at ?? now.toISOString();
    const volume = calculateEntryVolume(row.sets, row.reps, row.weight);
    return {
      id: row.id,
      workoutId: row.workout_id ?? row.workout?.id ?? null,
      exerciseId: row.exercise_id ?? row.exercise?.id ?? null,
      exerciseName: row.exercise?.name ?? "Unknown exercise",
      muscleGroup: row.exercise?.muscle_group ?? null,
      performedAt: performed,
      sets: row.sets ?? 0,
      reps: row.reps ?? null,
      weight: row.weight ?? null,
      totalVolume: volume,
      unit: row.unit ?? null,
    } satisfies HistoryEntry;
  }) ?? [];
}

export async function getVolumeAnalytics(
  supabase: SupabaseClient,
  userId: string
): Promise<VolumeSummary[]> {
  try {
    const { data, error } = await supabase
      .from<VolumeViewRow>("v_user_training_volume")
      .select("period,total_volume")
      .eq("user_id", userId)
      .limit(500);

    if (!error && data?.length) {
      const totals: Record<HistoryRange, number> = { "7d": 0, "30d": 0 };
      for (const row of data as { period?: string | null; total_volume?: number | null }[]) {
        const period = row.period === "7d" || row.period === "30d" ? row.period : null;
        if (!period) continue;
        totals[period] += row.total_volume ? Number(row.total_volume) : 0;
      }
      return [
        { period: "7d", totalVolume: totals["7d"] },
        { period: "30d", totalVolume: totals["30d"] },
      ];
    }
  } catch (error) {
    console.warn("Failed to resolve training volume view", error);
  }

  const fallbackEntries = await getHistoryEntries(supabase, userId, "30d");
  return buildVolumeSummary(fallbackEntries);
}

export interface HistorySnapshotResponse {
  data: HistoryEntry[];
  trend: HistoryTrendPoint[];
  range: HistoryRange;
  lastSyncedAt?: string | null;
}
