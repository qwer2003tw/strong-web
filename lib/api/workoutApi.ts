import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { ApiRequestOptions, ApiResponse } from "@/types/api";
import { createApiError } from "@/types/api";
import type {
  WorkoutDetailView,
  WorkoutEntryInsert,
  WorkoutEntryWithExercise,
  WorkoutExportView,
  WorkoutRow,
  WorkoutSummaryView,
  WorkoutUpdate,
} from "@/types/view";

async function resolveClient(options?: ApiRequestOptions) {
  if (options?.client) {
    return options.client;
  }
  return createServerSupabaseClient();
}

export const WorkoutAPI = {
  async list(userId: string, options?: ApiRequestOptions): Promise<ApiResponse<WorkoutSummaryView[]>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("workouts")
        .select("id, user_id, title, notes, scheduled_for, status, created_at, updated_at")
        .eq("user_id", userId)
        .order("scheduled_for", { ascending: true, nullsFirst: true });

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: createApiError("Failed to load workouts", error),
        };
      }

      return { data: (data ?? []) as WorkoutSummaryView[], error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while loading workouts", error) };
    }
  },

  async fetchById(
    userId: string,
    workoutId: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<WorkoutDetailView>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("workouts")
        .select(
          `id, user_id, title, notes, scheduled_for, status, created_at, updated_at, workout_entries(id, workout_id, exercise_id, position, sets, reps, weight, unit, notes, created_at, updated_at, exercises(id, name, muscle_group))`
        )
        .eq("user_id", userId)
        .eq("id", workoutId);

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        return {
          data: null,
          error: createApiError("Workout not found", error ?? new Error("Workout not found")),
        };
      }

      return { data: data as unknown as WorkoutDetailView, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while fetching workout", error) };
    }
  },

  async create(
    userId: string,
    payload: Partial<WorkoutRow>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<WorkoutRow>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("workouts")
        .insert({
          user_id: userId,
          title: payload.title ?? "",
          notes: payload.notes ?? null,
          scheduled_for: payload.scheduled_for ?? null,
          status: payload.status ?? "draft",
        });

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query.select("*").single();

      if (error || !data) {
        return {
          data: null,
          error: createApiError("Failed to create workout", error ?? new Error("No data returned")),
        };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while creating workout", error) };
    }
  },

  async update(
    userId: string,
    workoutId: string,
    payload: WorkoutUpdate,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<WorkoutRow>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("workouts")
        .update(payload)
        .eq("user_id", userId)
        .eq("id", workoutId);

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query.select("*").single();

      if (error || !data) {
        return {
          data: null,
          error: createApiError("Failed to update workout", error ?? new Error("No data returned")),
        };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while updating workout", error) };
    }
  },

  async remove(
    userId: string,
    workoutId: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<null>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase.from("workouts").delete().eq("user_id", userId).eq("id", workoutId);

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { error } = await query;

      if (error) {
        return { data: null, error: createApiError("Failed to delete workout", error) };
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while deleting workout", error) };
    }
  },

  async addEntry(
    workoutId: string,
    payload: WorkoutEntryInsert,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<WorkoutEntryWithExercise>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("workout_entries")
        .insert({
          workout_id: workoutId,
          exercise_id: payload.exercise_id,
          sets: payload.sets,
          reps: payload.reps ?? null,
          weight: payload.weight ?? null,
          unit: payload.unit ?? null,
          notes: payload.notes ?? null,
          position: payload.position ?? 1,
        });

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query
        .select("id, workout_id, exercise_id, position, sets, reps, weight, unit, notes, created_at, updated_at, exercises(id, name, muscle_group)")
        .single();

      if (error || !data) {
        return {
          data: null,
          error: createApiError("Failed to create workout entry", error ?? new Error("No data returned")),
        };
      }

      return { data: data as unknown as WorkoutEntryWithExercise, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while creating workout entry", error) };
    }
  },

  async removeEntry(
    workoutId: string,
    entryId: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<null>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("workout_entries")
        .delete()
        .eq("id", entryId)
        .eq("workout_id", workoutId);

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { error } = await query;

      if (error) {
        return { data: null, error: createApiError("Failed to remove workout entry", error) };
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while removing workout entry", error) };
    }
  },

  async exportAll(
    userId: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<WorkoutExportView[]>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("workouts")
        .select(
          "id, user_id, title, notes, scheduled_for, status, created_at, updated_at, workout_entries(id, workout_id, exercise_id, position, sets, reps, weight, unit, notes, created_at, updated_at)"
        )
        .eq("user_id", userId);

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: createApiError("Failed to export workouts", error) };
      }

      return { data: (data ?? []) as WorkoutExportView[], error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while exporting workouts", error) };
    }
  },

};
