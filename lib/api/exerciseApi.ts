import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { ApiRequestOptions, ApiResponse } from "@/types/api";
import { createApiError } from "@/types/api";
import type { ExerciseExportView, ExerciseRow, ExerciseSummaryView } from "@/types/view";

async function resolveClient(options?: ApiRequestOptions) {
  if (options?.client) {
    return options.client;
  }
  return createServerSupabaseClient();
}

export const ExerciseAPI = {
  async list(userId: string, options?: ApiRequestOptions): Promise<ApiResponse<ExerciseSummaryView[]>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("exercises")
        .select("id, name, muscle_group, equipment, notes, updated_at")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: createApiError("Failed to load exercises", error) };
      }

      return { data: (data ?? []) as ExerciseSummaryView[], error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while loading exercises", error) };
    }
  },

  async create(
    userId: string,
    payload: Partial<ExerciseRow>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<ExerciseRow>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("exercises")
        .insert({
          user_id: userId,
          name: payload.name ?? "",
          muscle_group: payload.muscle_group ?? null,
          equipment: payload.equipment ?? null,
          notes: payload.notes ?? null,
        });

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query.select("*").single();

      if (error || !data) {
        return { data: null, error: createApiError("Failed to create exercise", error ?? new Error("No data")) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while creating exercise", error) };
    }
  },

  async exportAll(
    userId: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<ExerciseExportView[]>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase
        .from("exercises")
        .select("id, name, muscle_group, equipment, notes, created_at, updated_at")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (options?.signal) {
        query.abortSignal(options.signal);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: createApiError("Failed to export exercises", error) };
      }

      return { data: (data ?? []) as ExerciseExportView[], error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while exporting exercises", error) };
    }
  },

};
