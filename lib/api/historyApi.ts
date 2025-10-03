import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { ApiRequestOptions, ApiResponse } from "@/types/api";
import { createApiError } from "@/types/api";
import {
  buildVolumeSummary,
  calculateEntryVolume,
  type HistoryEntry,
  type HistoryRange,
  type VolumeSummary,
} from "@/lib/history";
import type { UnitSystem } from "@/types/db";

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

const RANGE_IN_DAYS: Record<HistoryRange, number> = {
  "7d": 7,
  "30d": 30,
};

function getRangeStart(range: HistoryRange) {
  const reference = new Date();
  reference.setHours(0, 0, 0, 0);
  const days = RANGE_IN_DAYS[range];
  const start = new Date(reference);
  start.setDate(reference.getDate() - (days - 1));
  return start;
}

async function resolveClient(options?: ApiRequestOptions) {
  if (options?.client) {
    return options.client;
  }
  return createServerSupabaseClient();
}

function mapHistoryRows(rows: HistoryQueryRow[]): HistoryEntry[] {
  const now = new Date().toISOString();
  return rows.map((row) => {
    const performed = row.workout?.scheduled_for ?? row.created_at ?? now;
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
      totalVolume: calculateEntryVolume(row.sets, row.reps, row.weight),
      unit: row.unit ?? null,
    } satisfies HistoryEntry;
  });
}

export const HistoryAPI = {
  async listEntries(
    userId: string,
    range: HistoryRange,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<HistoryEntry[]>> {
    try {
      const supabase = await resolveClient(options);
      const since = getRangeStart(range).toISOString();
      const query = supabase
        .from("workout_entries")
        .select(
          `id, workout_id, exercise_id, sets, reps, weight, unit, created_at, workout:workouts!inner(id, user_id, scheduled_for), exercise:exercises(id, name, muscle_group)`
        )
        .eq("workouts.user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: createApiError("Failed to load history entries", error) };
      }

      return { data: mapHistoryRows((data ?? []) as HistoryQueryRow[]), error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while loading history entries", error) };
    }
  },

  async loadVolumeSummary(
    userId: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<VolumeSummary[]>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("v_user_training_volume")
        .select("period,total_volume")
        .eq("user_id", userId)
        .limit(500);

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query;

      if (!error && data?.length) {
        const totals: Record<HistoryRange, number> = { "7d": 0, "30d": 0 };
        for (const row of data) {
          const period = row.period;
          if (period !== "7d" && period !== "30d") {
            continue;
          }
          const normalized = period as HistoryRange;
          totals[normalized] += row.total_volume ? Number(row.total_volume) : 0;
        }
        return {
          data: [
            { period: "7d", totalVolume: totals["7d"] },
            { period: "30d", totalVolume: totals["30d"] },
          ],
          error: null,
        };
      }

      const fallback = await HistoryAPI.listEntries(userId, "30d", { ...options, client: supabase });
      if (fallback.error || !fallback.data) {
        return {
          data: null,
          error: fallback.error ?? createApiError("Unable to compute volume summary", error),
        };
      }
      return { data: buildVolumeSummary(fallback.data), error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while loading volume summary", error) };
    }
  },
};
